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

/** IP-keyed limit; skipped when the client IP is unknown (see getClientIp). */
export function enforceIpRateLimit(prefix: string, ip: string | null, limit: Limit): void {
  if (ip) enforceRateLimit(`${prefix}:${ip}`, limit);
}
