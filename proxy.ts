import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { readVisitorId, VISITOR_COOKIE, visitorCookieOptions } from "./lib/visitor";

const intlProxy = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const response = intlProxy(request);

  // Give every browser its anonymous visitor id on the first page view, so
  // praying/posting never has to mint one mid-request.
  if (!readVisitorId(request.cookies)) {
    response.cookies.set(VISITOR_COOKIE, crypto.randomUUID(), visitorCookieOptions(request));
  }

  return response;
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
