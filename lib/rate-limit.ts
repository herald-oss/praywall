// In-memory sliding-window rate limiter. Good enough for a single Railway
// hobby instance — no extra DB writes per request. If this ever runs across
// multiple instances, swap the Map for a shared store (Redis, Postgres table).
const globalStore = globalThis as unknown as {
  __praywallRateLimit?: Map<string, number[]>;
};

const store = (globalStore.__praywallRateLimit ??= new Map<string, number[]>());

const MAX_TRACKED_KEYS = 5000;

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

  const timestamps = (store.get(key) ?? []).filter(
    (t) => now - t < windowMs
  );

  if (timestamps.length >= limit) {
    const retryAfterMs = windowMs - (now - timestamps[0]);
    store.set(key, timestamps);
    return { allowed: false, retryAfterSec: Math.ceil(retryAfterMs / 1000) };
  }

  timestamps.push(now);
  store.set(key, timestamps);

  if (store.size > MAX_TRACKED_KEYS) {
    purgeExpired(windowMs);
  }

  return { allowed: true };
}

function purgeExpired(windowMs: number) {
  const now = Date.now();
  for (const [key, timestamps] of store) {
    const fresh = timestamps.filter((t) => now - t < windowMs);
    if (fresh.length === 0) {
      store.delete(key);
    } else {
      store.set(key, fresh);
    }
  }
}
