import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { copySetCookies } from "@/lib/auth-cookies";
import { LIMITS } from "@/lib/config";
import { DISPLAY_NAME_MAX_CHARS } from "@/lib/constants";
import { db } from "@/lib/db";
import { intercessions, prayers, user } from "@/lib/db/schema";
import { readJson } from "@/lib/http/body";
import { getClientIp } from "@/lib/http/client-ip";
import { errorResponse, HttpError } from "@/lib/http/errors";
import { assertSameOrigin } from "@/lib/http/origin";
import { enforceRateLimit } from "@/lib/http/rate";
import { containsProfanity, moderateText } from "@/lib/moderation";
import { parseInput, signupSchema } from "@/lib/validation";
import { readVisitorId } from "@/lib/visitor";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(`signup:ip:${getClientIp(request)}`, LIMITS.signupPerIp);

    const input = parseInput(signupSchema, await readJson(request));
    const username = input.username.toLowerCase();
    const displayName = input.displayName.trim();

    if (containsProfanity(username)) {
      throw new HttpError(400, "inappropriate_content");
    }
    const nameCheck = moderateText(displayName, { maxLen: DISPLAY_NAME_MAX_CHARS });
    if (!nameCheck.ok) {
      throw new HttpError(400, nameCheck.code === "empty" ? "name_required" : nameCheck.code!);
    }

    const [taken] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.username, username))
      .limit(1);
    if (taken) throw new HttpError(409, "username_taken");

    const authResponse = await auth.api.signUpEmail({
      body: {
        email: `${username}@praywall.local`,
        password: input.password,
        name: displayName,
        username,
      },
      headers: request.headers,
      // Without asResponse the session Set-Cookie header is dropped.
      asResponse: true,
    });
    if (authResponse.status === 422) throw new HttpError(409, "username_taken");
    if (!authResponse.ok) throw new HttpError(500, "signup_failed");

    const result = (await authResponse.json()) as { user?: { id: string } };
    if (!result.user) throw new HttpError(500, "signup_failed");
    const userId = result.user.id;

    // Adopt this browser's anonymous history — but only rows nobody owns yet.
    // On a shared device the cookie may also match prayers that already
    // belong to someone else's account; those must never change hands.
    const visitorId = readVisitorId(request.cookies);
    if (visitorId) {
      await db
        .update(prayers)
        .set({ userId })
        .where(
          and(
            eq(prayers.visitorId, visitorId),
            isNull(prayers.userId),
            isNull(prayers.archivedAt)
          )
        );
      await db
        .update(intercessions)
        .set({ userId })
        .where(and(eq(intercessions.visitorId, visitorId), isNull(intercessions.userId)));
    }

    const response = NextResponse.json(
      { user: { id: userId, username, name: displayName } },
      { status: 201 }
    );
    copySetCookies(authResponse, response);
    return response;
  } catch (error) {
    return errorResponse(error, "Signup failed");
  }
}
