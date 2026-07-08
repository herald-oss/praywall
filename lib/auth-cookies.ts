/**
 * Copies every Set-Cookie header from a Better-Auth `asResponse: true`
 * response onto our own NextResponse. Better-Auth's server API (used
 * directly, not through the catch-all handler) only returns cookies when
 * asResponse:true is passed — otherwise the session cookie it wants to set
 * is silently dropped and the browser never actually gets logged in.
 *
 * Headers.getSetCookie() is the only correct way to read multiple
 * Set-Cookie values (a plain .get("set-cookie") would join them with a
 * comma, which breaks cookies that contain a comma in their Expires date).
 */
export function copySetCookies(source: Response, target: Response): void {
  for (const cookie of source.headers.getSetCookie()) {
    target.headers.append("Set-Cookie", cookie);
  }
}
