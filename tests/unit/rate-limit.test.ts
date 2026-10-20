import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("allows up to the limit and then blocks with retryAfter", () => {
    const key = `test:${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit(key, { limit: 3, windowMs: 10_000 }).allowed).toBe(true);
    }
    const blocked = checkRateLimit(key, { limit: 3, windowMs: 10_000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBe(10);
  });

  it("frees the slot once the window slides past", () => {
    const key = `test:${Math.random()}`;
    checkRateLimit(key, { limit: 1, windowMs: 1_000 });
    expect(checkRateLimit(key, { limit: 1, windowMs: 1_000 }).allowed).toBe(false);
    vi.advanceTimersByTime(1_001);
    expect(checkRateLimit(key, { limit: 1, windowMs: 1_000 }).allowed).toBe(true);
  });

  it("keeps separate buckets per key", () => {
    const a = `a:${Math.random()}`;
    const b = `b:${Math.random()}`;
    expect(checkRateLimit(a, { limit: 1 }).allowed).toBe(true);
    expect(checkRateLimit(a, { limit: 1 }).allowed).toBe(false);
    expect(checkRateLimit(b, { limit: 1 }).allowed).toBe(true);
  });
});
