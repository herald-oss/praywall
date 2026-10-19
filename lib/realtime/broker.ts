import type { PublicPrayer } from "@/lib/prayers/serialize";

// In-process pub/sub for the wall's Server-Sent Events. State lives on
// globalThis so every route bundle (and dev HMR reloads) share one broker.
// Single Railway instance only — with several instances this would need
// Postgres LISTEN/NOTIFY or Redis.

export type WallEvent =
  | { type: "prayer"; prayer: PublicPrayer }
  | { type: "count"; id: string; intercessorCount: number; goalReached: boolean }
  | { type: "removed"; id: string };

interface Client {
  ip: string | null;
  send: (chunk: string) => boolean;
}

interface BrokerState {
  clients: Map<number, Client>;
  perIp: Map<string, number>;
  nextId: number;
  heartbeat: ReturnType<typeof setInterval> | null;
  pendingCounts: Map<string, { intercessorCount: number; goalReached: boolean }>;
  flushTimer: ReturnType<typeof setTimeout> | null;
}

function envInt(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// Railway closes idle connections after 5 minutes without data, so the
// heartbeat must stay well under that.
const HEARTBEAT_MS = envInt("SSE_HEARTBEAT_MS", 25_000);
const MAX_CONNECTIONS = envInt("SSE_MAX_CONNECTIONS", 500);
// Generous: a congregation on one Wi-Fi can have many phones open.
const MAX_PER_IP = envInt("SSE_MAX_PER_IP", 30);
// Many people praying at once would otherwise send one event per prayer tap.
const COUNT_FLUSH_MS = envInt("SSE_COUNT_FLUSH_MS", 2_000);

const g = globalThis as unknown as { __praywallBroker?: BrokerState };
const state: BrokerState = (g.__praywallBroker ??= {
  clients: new Map(),
  perIp: new Map(),
  nextId: 1,
  heartbeat: null,
  pendingCounts: new Map(),
  flushTimer: null,
});

/** Unknown IPs (null) only count toward the global cap, never a shared per-IP pool. */
export function canAccept(ip: string | null): boolean {
  if (state.clients.size >= MAX_CONNECTIONS) return false;
  return ip == null || (state.perIp.get(ip) ?? 0) < MAX_PER_IP;
}

export function register(ip: string | null, send: (chunk: string) => boolean): number {
  const id = state.nextId++;
  state.clients.set(id, { ip, send });
  if (ip != null) state.perIp.set(ip, (state.perIp.get(ip) ?? 0) + 1);
  startHeartbeat();
  return id;
}

export function unregister(id: number): void {
  const client = state.clients.get(id);
  if (!client) return;
  state.clients.delete(id);
  if (client.ip != null) {
    const left = (state.perIp.get(client.ip) ?? 1) - 1;
    if (left <= 0) state.perIp.delete(client.ip);
    else state.perIp.set(client.ip, left);
  }
  if (state.clients.size === 0) stopHeartbeat();
}

export function connectionCount(): number {
  return state.clients.size;
}

export function publish(event: WallEvent): void {
  if (event.type === "count") {
    state.pendingCounts.set(event.id, {
      intercessorCount: event.intercessorCount,
      goalReached: event.goalReached,
    });
    if (!state.flushTimer) {
      state.flushTimer = setTimeout(flushCounts, COUNT_FLUSH_MS);
      state.flushTimer.unref?.();
    }
    return;
  }
  const data = event.type === "prayer" ? event.prayer : { id: event.id };
  broadcast(`event: ${event.type}\ndata: ${JSON.stringify(data)}\n\n`);
}

function flushCounts() {
  state.flushTimer = null;
  const pending = state.pendingCounts;
  state.pendingCounts = new Map();
  for (const [id, value] of pending) {
    broadcast(`event: count\ndata: ${JSON.stringify({ id, ...value })}\n\n`);
  }
}

function broadcast(chunk: string) {
  for (const [id, client] of state.clients) {
    if (!client.send(chunk)) unregister(id);
  }
}

function startHeartbeat() {
  if (state.heartbeat) return;
  // One timer for all connections instead of one per client.
  state.heartbeat = setInterval(() => broadcast(": ping\n\n"), HEARTBEAT_MS);
  state.heartbeat.unref?.();
}

function stopHeartbeat() {
  if (state.heartbeat) clearInterval(state.heartbeat);
  state.heartbeat = null;
}
