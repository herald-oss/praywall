import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { copySetCookies } from "@/lib/auth-cookies";
import { LIMITS } from "@/lib/config";
import { readJson } from "@/lib/http/body";
import { getClientIp } from "@/lib/http/client-ip";
import { errorResponse, HttpError } from "@/lib/http/errors";
import { assertSameOrigin } from "@/lib/http/origin";
import { enforceIpRateLimit, enforceRateLimit } from "@/lib/http/rate";
import { loginSchema, parseInput } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    // Better-Auth's own rate limiter doesn't apply to server-side auth.api
    // calls, so brute-force protection lives here: per IP and per username.
    enforceIpRateLimit("login:ip", getClientIp(request), LIMITS.loginPerIp);

    const { username, password } = parseInput(loginSchema, await readJson(request));
    const normalized = username.trim().toLowerCase();
    enforceRateLimit(`login:user:${normalized}`, LIMITS.loginPerUsername);

    const authResponse = await auth.api.signInEmail({
      body: { email: `${normalized}@praywall.local`, password },
      headers: request.headers,
      // Without asResponse the session Set-Cookie header is dropped.
      asResponse: true,
    });
    if (!authResponse.ok) throw new HttpError(401, "invalid_credentials");

    const result = (await authResponse.json()) as {
      user?: { id: string; name: string; username?: string | null };
    };
    if (!result.user) throw new HttpError(401, "invalid_credentials");

    // The session token stays in the httpOnly cookie — never in the body.
    const response = NextResponse.json({
      user: {
        id: result.user.id,
        username: result.user.username ?? normalized,
        name: result.user.name,
      },
    });
    copySetCookies(authResponse, response);
    return response;
  } catch (error) {
    return errorResponse(error, "Login failed");
  }
}
