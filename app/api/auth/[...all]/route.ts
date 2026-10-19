import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { clearVisitorCookieHeader } from "@/lib/visitor";

const handler = toNextJsHandler(auth);

// The only native Better-Auth endpoints the app uses. Everything else returns
// 404 — sign-up/sign-in go through our own routes (username rules, profanity
// filter, rate limits) and the rest isn't needed at all.
const ALLOWED_POST = new Set(["/sign-out", "/delete-user", "/change-password"]);

// After sign-out or account deletion, drop the anonymous visitor cookie too,
// so the next person on a shared device (e.g. a church computer) can't see or
// delete what the previous person posted or prayed for.
const CLEARS_VISITOR = new Set(["/sign-out", "/delete-user"]);

function subPath(request: Request): string {
  return new URL(request.url).pathname.replace(/^\/api\/auth/, "") || "/";
}

function notFound() {
  return new Response("Not Found", { status: 404 });
}

export async function GET() {
  return notFound();
}

export async function POST(request: Request) {
  const path = subPath(request);
  if (!ALLOWED_POST.has(path)) return notFound();

  const response = await handler.POST(request);
  if (!response.ok || !CLEARS_VISITOR.has(path)) return response;

  const withCleared = new Response(response.body, response);
  withCleared.headers.append("Set-Cookie", clearVisitorCookieHeader(request));
  return withCleared;
}
