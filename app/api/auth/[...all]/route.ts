import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { readJson } from "@/lib/http/body";
import { errorResponse, HttpError } from "@/lib/http/errors";
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

// These bodies are tiny; Better-Auth would otherwise buffer any size.
const MAX_AUTH_BODY_BYTES = 4 * 1024;

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

  let body: unknown;
  try {
    body = await readJson(request, MAX_AUTH_BODY_BYTES);
    // Better-Auth skips the password check on delete-user when the session
    // is "fresh" and no password is sent. The UI always asks for it, so
    // require it — someone at a shared computer with a forgotten open
    // session must not be able to delete that account.
    if (path === "/delete-user") {
      const password = (body as { password?: unknown } | null)?.password;
      if (typeof password !== "string" || password.length === 0) {
        throw new HttpError(400, "invalid_password");
      }
    }
  } catch (error) {
    return errorResponse(error, "Auth request rejected");
  }

  // Re-create the request from the already-validated body (the original
  // stream has been consumed).
  const headers = new Headers(request.headers);
  headers.delete("content-length");
  const forwarded = new Request(request.url, {
    method: "POST",
    headers,
    body: JSON.stringify(body ?? {}),
  });

  const response = await handler.POST(forwarded);
  if (!response.ok || !CLEARS_VISITOR.has(path)) return response;

  const withCleared = new Response(response.body, response);
  withCleared.headers.append("Set-Cookie", clearVisitorCookieHeader(request));
  return withCleared;
}
