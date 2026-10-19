import type { NextRequest, NextResponse } from "next/server";
import { isUuid } from "@/lib/validation";

// Anonymous identity: a random UUID in an httpOnly cookie. It lets someone
// without an account manage their own prayers and stops one browser from
// praying twice for the same request. It's issued on the first page view
// (proxy.ts) so browser flows always have one before any API call.

export const VISITOR_COOKIE = "praywall_visitor";
const ONE_YEAR_SEC = 60 * 60 * 24 * 365;

type CookieSource = { get(name: string): { value: string } | undefined };

/** The visitor id if the cookie holds a well-formed UUID, else null. */
export function readVisitorId(cookies: CookieSource): string | null {
  const value = cookies.get(VISITOR_COOKIE)?.value;
  return isUuid(value) ? value : null;
}

function isHttps(request: Request): boolean {
  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwarded) return forwarded === "https";
  return new URL(request.url).protocol === "https:";
}

export function visitorCookieOptions(request: Request) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isHttps(request),
    maxAge: ONE_YEAR_SEC,
    path: "/",
  };
}

/** Returns the existing visitor id or mints a new one (caller must persist). */
export function getOrCreateVisitorId(request: NextRequest): {
  visitorId: string;
  isNew: boolean;
} {
  const existing = readVisitorId(request.cookies);
  if (existing) return { visitorId: existing, isNew: false };
  return { visitorId: crypto.randomUUID(), isNew: true };
}

export function setVisitorCookie(
  response: NextResponse,
  visitorId: string,
  request: Request
): void {
  response.cookies.set(VISITOR_COOKIE, visitorId, visitorCookieOptions(request));
}

/** Raw Set-Cookie value that removes the visitor cookie. */
export function clearVisitorCookieHeader(request: Request): string {
  return `${VISITOR_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${
    isHttps(request) ? "; Secure" : ""
  }`;
}
