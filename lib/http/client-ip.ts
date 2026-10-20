// Railway's edge proxy sets X-Real-IP to the real client address, so that
// is the default. X-Forwarded-For is never trusted: clients can prepend
// anything to it. Set TRUSTED_IP_HEADER to another header name if you deploy
// behind a different proxy, or to "none" to disable IP-based keys.

let warnedMissing = false;

function configuredHeader(): string | null {
  const header = (process.env.TRUSTED_IP_HEADER ?? "x-real-ip").toLowerCase();
  return header === "none" ? null : header;
}

/**
 * The client IP, or null when it can't be determined. Callers must not
 * treat null as one ordinary IP (see enforceIpRateLimit): lumping everyone
 * into one normal-sized bucket would let a single abuser lock out everyone.
 */
export function getClientIp(request: Request): string | null {
  const header = configuredHeader();
  if (!header) return null;
  const value = request.headers.get(header)?.split(",")[0]?.trim();
  if (value) return value.slice(0, 64);
  if (process.env.NODE_ENV === "production" && !warnedMissing) {
    warnedMissing = true;
    console.warn(
      `[praywall] No "${header}" header on incoming requests — falling back to coarse site-wide rate limits. Set TRUSTED_IP_HEADER for your proxy.`
    );
  }
  return null;
}

/** Header list for Better-Auth's own rate limiter / session IP. */
export function trustedIpHeaders(): string[] {
  const header = configuredHeader();
  return header ? [header] : [];
}
