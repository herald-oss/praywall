import type { Limit } from "@/lib/config";
import { checkRateLimit } from "@/lib/rate-limit";
import { HttpError } from "./errors";

/** Throws a 429 HttpError (with Retry-After) when the bucket is full. */
export function enforceRateLimit(key: string, limit: Limit): void {
  const result = checkRateLimit(key, limit);
  if (!result.allowed) {
    throw new HttpError(429, "rate_limit", {
      "Retry-After": String(result.retryAfterSec ?? 60),
    });
  }
}

// When the client IP is unknown (proxy header missing), everyone would share
// one bucket. Using the normal per-IP limit there would let one abuser lock
// out every visitor; skipping it would leave signups/logins unlimited. So
// unknown IPs share a much larger, site-wide bucket instead.
const UNKNOWN_IP_MULTIPLIER = 20;

/** IP-keyed limit, with a coarse site-wide fallback when the IP is unknown. */
export function enforceIpRateLimit(prefix: string, ip: string | null, limit: Limit): void {
  if (ip) {
    enforceRateLimit(`${prefix}:${ip}`, limit);
  } else {
    enforceRateLimit(`${prefix}:unknown-ip`, {
      limit: limit.limit * UNKNOWN_IP_MULTIPLIER,
      windowMs: limit.windowMs,
    });
  }
}
