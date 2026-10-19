import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { LIMITS } from "@/lib/config";
import { USERNAME_REGEX } from "@/lib/constants";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { getClientIp } from "@/lib/http/client-ip";
import { errorResponse } from "@/lib/http/errors";
import { enforceIpRateLimit } from "@/lib/http/rate";

export async function GET(request: NextRequest) {
  try {
    enforceIpRateLimit("check-username:ip", getClientIp(request), LIMITS.checkUsernamePerIp);

    const username = request.nextUrl.searchParams.get("username");
    if (!username || !USERNAME_REGEX.test(username)) {
      return NextResponse.json({ available: false });
    }

    const existing = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.username, username.toLowerCase()))
      .limit(1);

    return NextResponse.json({ available: existing.length === 0 });
  } catch (error) {
    return errorResponse(error, "Username check failed");
  }
}
