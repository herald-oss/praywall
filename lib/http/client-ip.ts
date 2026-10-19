// Railway's edge proxy sets X-Real-IP to the real client address, so that
// is the default. X-Forwarded-For is never trusted: clients can prepend
// anything to it. Set TRUSTED_IP_HEADER to another header name if you deploy
// behind a different proxy, or to "none" to disable IP-based keys.

export function getClientIp(request: Request): string {
  const header = (process.env.TRUSTED_IP_HEADER ?? "x-real-ip").toLowerCase();
  if (header !== "none") {
    const value = request.headers.get(header)?.split(",")[0]?.trim();
    if (value) return value.slice(0, 64);
  }
  return "unknown";
}

/** Header list for Better-Auth's own rate limiter / session IP. */
export function trustedIpHeaders(): string[] {
  const header = (process.env.TRUSTED_IP_HEADER ?? "x-real-ip").toLowerCase();
  return header === "none" ? [] : [header];
}
