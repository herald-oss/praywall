import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, prayers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { containsProfanity, moderateText } from "@/lib/moderation";
import { checkRateLimit } from "@/lib/rate-limit";
import { copySetCookies } from "@/lib/auth-cookies";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, displayName } = body;

    const rateLimitKey =
      request.cookies.get("praywall_visitor")?.value ||
      request.headers.get("x-forwarded-for") ||
      "unknown";
    const rateLimit = checkRateLimit(`signup:${rateLimitKey}`, {
      limit: 3,
      windowMs: 300_000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "rate_limit" },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSec) },
        }
      );
    }

    if (!username || !USERNAME_REGEX.test(username)) {
      return NextResponse.json(
        { error: "Username must be 3-20 characters, letters, numbers, and underscores only" },
        { status: 400 }
      );
    }

    if (containsProfanity(username)) {
      return NextResponse.json(
        { error: "inappropriate_content" },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (!displayName || typeof displayName !== "string") {
      return NextResponse.json(
        { error: "Display name is required" },
        { status: 400 }
      );
    }

    const nameModeration = moderateText(displayName, { maxLen: 30 });
    if (!nameModeration.ok) {
      if (nameModeration.code === "empty") {
        return NextResponse.json(
          { error: "Display name is required" },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: nameModeration.code }, { status: 400 });
    }

    // Check if username is taken
    const existing = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.username, username.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }

    // Create user via Better-Auth with fake email
    const fakeEmail = `${username.toLowerCase()}@praywall.local`;
    const headersList = await headers();

    // asResponse:true is required to get the Set-Cookie header Better-Auth
    // wants to set for the new session — without it, the session cookie is
    // silently dropped and the browser never actually ends up logged in
    // server-side (session-based checks would always see no session).
    const authResponse = await auth.api.signUpEmail({
      body: {
        email: fakeEmail,
        password,
        name: displayName.trim().slice(0, 30),
      },
      headers: headersList,
      asResponse: true,
    });

    const result = authResponse.ok ? await authResponse.json() : null;

    if (!result?.user) {
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }

    // Set the username on the user record
    await db
      .update(user)
      .set({ username: username.toLowerCase() })
      .where(eq(user.id, result.user.id));

    // Link anonymous prayers from this visitor to the new user
    const visitorId = request.cookies.get("praywall_visitor")?.value;
    if (visitorId) {
      await db
        .update(prayers)
        .set({ userId: result.user.id })
        .where(eq(prayers.visitorId, visitorId));
    }

    const response = NextResponse.json(
      {
        user: {
          id: result.user.id,
          username: username.toLowerCase(),
          name: displayName.trim().slice(0, 30),
        },
        token: result.token,
      },
      { status: 201 }
    );
    copySetCookies(authResponse, response);
    return response;
  } catch (error) {
    console.error("Signup failed:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
