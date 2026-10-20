import { HttpError } from "./errors";

/**
 * Origins allowed to make state-changing requests: the app's own URLs plus
 * BETTER_AUTH_TRUSTED_ORIGINS (comma-separated — e.g. both production
 * domains). Better-Auth reads the same env var for its own endpoints.
 */
export function getTrustedOrigins(): string[] {
  const raw = [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "").split(","),
  ];
  const origins = new Set<string>();
  for (const value of raw) {
    const trimmed = value?.trim();
    if (!trimmed) continue;
    try {
      origins.add(new URL(trimmed).origin);
    } catch {
      // ignore malformed entries
    }
  }
  return [...origins];
}

/**
 * CSRF defense for our own POST/PATCH/DELETE routes (Better-Auth's built-in
 * origin check only runs for its own HTTP endpoints). Browsers always send
 * `Origin` on cross-origin and same-origin non-GET fetches, and attackers
 * can't forge it. Requests with neither Origin nor Sec-Fetch-Site come from
 * non-browser clients, which aren't a CSRF vector, so they're allowed (the
 * JSON content-type requirement and rate limits still apply).
 */
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (origin) {
    if (origin === "null") throw new HttpError(403, "forbidden_origin");
    let originHost: string;
    try {
      originHost = new URL(origin).host;
    } catch {
      throw new HttpError(403, "forbidden_origin");
    }
    const requestHost =
      request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
      request.headers.get("host");
    if (originHost === requestHost) return;
    if (getTrustedOrigins().includes(origin)) return;
    throw new HttpError(403, "forbidden_origin");
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    throw new HttpError(403, "forbidden_origin");
  }
}
