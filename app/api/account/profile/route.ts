import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { copySetCookies } from "@/lib/auth-cookies";
import { LIMITS } from "@/lib/config";
import { DISPLAY_NAME_MAX_CHARS } from "@/lib/constants";
import { db } from "@/lib/db";
import { prayers } from "@/lib/db/schema";
import { readJson } from "@/lib/http/body";
import { errorResponse, HttpError } from "@/lib/http/errors";
import { assertSameOrigin } from "@/lib/http/origin";
import { enforceRateLimit } from "@/lib/http/rate";
import { moderateText } from "@/lib/moderation";
import { parseInput, updateProfileSchema } from "@/lib/validation";

// Changes the display name. Goes through our own route (not the native
// /update-user, which is blocked) so the profanity filter applies.
export async function PATCH(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) throw new HttpError(401, "unauthorized");
    enforceRateLimit(`profile:${session.user.id}`, LIMITS.profilePerUser);

    const { displayName } = parseInput(updateProfileSchema, await readJson(request));
    const name = displayName.trim();
    const check = moderateText(name, { maxLen: DISPLAY_NAME_MAX_CHARS });
    if (!check.ok) throw new HttpError(400, check.code === "empty" ? "name_required" : check.code!);

    // asResponse so the refreshed session cookie cache (with the new name)
    // reaches the browser.
    const authResponse = await auth.api.updateUser({
      body: { name },
      headers: request.headers,
      asResponse: true,
    });
    if (!authResponse.ok) throw new HttpError(500, "server_error");

    // Prayers signed with the account name show the new name too.
    await db
      .update(prayers)
      .set({ displayName: name })
      .where(and(eq(prayers.userId, session.user.id), eq(prayers.isAnonymous, false)));

    const response = NextResponse.json({ user: { name } });
    copySetCookies(authResponse, response);
    return response;
  } catch (error) {
    return errorResponse(error, "Profile update failed");
  }
}
