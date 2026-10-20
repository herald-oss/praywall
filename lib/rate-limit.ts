// In-memory sliding-window rate limiter for a single Railway instance — no
// extra DB writes per request. If the app ever runs on several instances,
// swap the Map for a shared store (Redis or a Postgres table).
//
// Each key remembers its own window, so a periodic sweep (and the emergency
// purge when the map gets too big) never drops a long-window key (e.g. a
// 24h cap) just because a short-window caller triggered the cleanup.

interface Bucket {
  windowMs: number;
  hits: number[];
}

const globalStore = globalThis as unknown as {
  __praywallRateLimit?: Map<string, Bucket>;
  __praywallRateLimitSweep?: ReturnType<typeof setInterval>;
};

const store = (globalStore.__praywallRateLimit ??= new Map<string, Bucket>());

const MAX_TRACKED_KEYS = 20_000;
const SWEEP_EVERY_MS = 60_000;

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSec?: number;
}

export function checkRateLimit(
  key: string,
  opts?: { limit?: number; windowMs?: number }
): RateLimitResult {
  const limit = opts?.limit ?? 5;
  const windowMs = opts?.windowMs ?? 60_000;
  const now = Date.now();
  ensureSweeper();

  const bucket = store.get(key);
  const hits = (bucket?.hits ?? []).filter((t) => now - t < windowMs);

  if (hits.length >= limit) {
    store.set(key, { windowMs, hits });
    const retryAfterMs = windowMs - (now - hits[0]);
    return { allowed: false, retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }

  hits.push(now);
  store.set(key, { windowMs, hits });

  if (store.size > MAX_TRACKED_KEYS) purge(now, true);

  return { allowed: true };
}

/** Test helper: forget every bucket. */
export function resetRateLimits(): void {
  store.clear();
}

function purge(now: number, emergency: boolean) {
  for (const [key, bucket] of store) {
    const fresh = bucket.hits.filter((t) => now - t < bucket.windowMs);
    if (fresh.length === 0) store.delete(key);
    else bucket.hits = fresh;
  }
  // Still too big after dropping expired hits: drop the oldest keys (Map
  // iterates in insertion order) so memory stays bounded under a flood.
  if (emergency && store.size > MAX_TRACKED_KEYS) {
    let excess = store.size - MAX_TRACKED_KEYS;
    for (const key of store.keys()) {
      if (excess-- <= 0) break;
      store.delete(key);
    }
  }
}

function ensureSweeper() {
  if (globalStore.__praywallRateLimitSweep) return;
  const timer = setInterval(() => purge(Date.now(), false), SWEEP_EVERY_MS);
  // Never keep the process alive just for the sweeper.
  timer.unref?.();
  globalStore.__praywallRateLimitSweep = timer;
}
