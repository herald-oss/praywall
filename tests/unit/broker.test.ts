import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The broker keeps its state on globalThis and reads env at import time, so
// each test gets a fresh module + fresh global state.
async function loadBroker(env: Record<string, string> = {}) {
  vi.resetModules();
  delete (globalThis as { __praywallBroker?: unknown }).__praywallBroker;
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  return import("@/lib/realtime/broker");
}

function fakeClient() {
  const chunks: string[] = [];
  return { chunks, send: (c: string) => (chunks.push(c), true) };
}

describe("realtime broker", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("broadcasts new prayers and removals to every client", async () => {
    const broker = await loadBroker();
    const a = fakeClient();
    const b = fakeClient();
    broker.register("1.1.1.1", a.send);
    broker.register("2.2.2.2", b.send);

    broker.publish({ type: "removed", id: "p1" });
    expect(a.chunks).toEqual(['event: removed\ndata: {"id":"p1"}\n\n']);
    expect(b.chunks).toEqual(a.chunks);
  });

  it("coalesces count updates per prayer", async () => {
    const broker = await loadBroker({ SSE_COUNT_FLUSH_MS: "1000" });
    const a = fakeClient();
    broker.register("1.1.1.1", a.send);

    broker.publish({ type: "count", id: "p1", intercessorCount: 1, goalReached: false });
    broker.publish({ type: "count", id: "p1", intercessorCount: 2, goalReached: false });
    broker.publish({ type: "count", id: "p2", intercessorCount: 33, goalReached: true });
    expect(a.chunks).toEqual([]);

    vi.advanceTimersByTime(1000);
    expect(a.chunks).toEqual([
      'event: count\ndata: {"id":"p1","intercessorCount":2,"goalReached":false}\n\n',
      'event: count\ndata: {"id":"p2","intercessorCount":33,"goalReached":true}\n\n',
    ]);
  });

  it("uses one shared heartbeat and stops it when nobody listens", async () => {
    const broker = await loadBroker({ SSE_HEARTBEAT_MS: "1000" });
    const a = fakeClient();
    const id = broker.register("1.1.1.1", a.send);
    vi.advanceTimersByTime(3000);
    expect(a.chunks).toEqual([": ping\n\n", ": ping\n\n", ": ping\n\n"]);

    broker.unregister(id);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("enforces global and per-IP caps", async () => {
    const broker = await loadBroker({ SSE_MAX_CONNECTIONS: "3", SSE_MAX_PER_IP: "2" });
    broker.register("1.1.1.1", fakeClient().send);
    broker.register("1.1.1.1", fakeClient().send);
    expect(broker.canAccept("1.1.1.1")).toBe(false);
    expect(broker.canAccept("2.2.2.2")).toBe(true);
    broker.register("2.2.2.2", fakeClient().send);
    expect(broker.canAccept("3.3.3.3")).toBe(false);
  });

  it("drops clients whose stream is gone", async () => {
    const broker = await loadBroker();
    broker.register("1.1.1.1", () => false);
    expect(broker.connectionCount()).toBe(1);
    broker.publish({ type: "removed", id: "p1" });
    expect(broker.connectionCount()).toBe(0);
  });
});
