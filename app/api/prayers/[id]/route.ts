import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { LIMITS } from "@/lib/config";
import { PRAYER_MAX_CHARS } from "@/lib/constants";
import { db } from "@/lib/db";
import { prayers, user } from "@/lib/db/schema";
import { readJson } from "@/lib/http/body";
import { getClientIp } from "@/lib/http/client-ip";
import { errorResponse, HttpError } from "@/lib/http/errors";
import { assertSameOrigin } from "@/lib/http/origin";
import { enforceRateLimit } from "@/lib/http/rate";
import { moderateText } from "@/lib/moderation";
import { archivePrayer } from "@/lib/prayers/archive";
import { publish } from "@/lib/realtime/broker";
import { isOwner, toPublicPrayer, type Requester } from "@/lib/prayers/serialize";
import { getRequester } from "@/lib/requester";
import { isUuid, parseInput, testimonySchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

// Same 404 for "doesn't exist", "not yours" and "malformed id" — never reveal
// whether a prayer id exists to someone who isn't its owner.
const notFound = () => new HttpError(404, "not_found");

// Ownership comes only from the session/cookie — never from the body.
async function loadOwnedPrayer(id: string, requester: Requester) {
  if (!isUuid(id)) throw notFound();
  const [row] = await db
    .select({
      id: prayers.id,
      userId: prayers.userId,
      visitorId: prayers.visitorId,
      answeredAt: prayers.answeredAt,
    })
    .from(prayers)
    .where(and(eq(prayers.id, id), isNull(prayers.archivedAt)))
    .limit(1);
  if (!row || !isOwner(row, requester)) throw notFound();
  return row;
}

function manageKey(request: NextRequest, requester: Requester) {
  return requester.userId ?? requester.visitorId ?? `ip:${getClientIp(request) ?? "unknown"}`;
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    assertSameOrigin(request);
    const { id } = await params;
    const requester = await getRequester(request.cookies);
    enforceRateLimit(`delete:${manageKey(request, requester)}`, LIMITS.managePerRequester);

    await loadOwnedPrayer(id, requester);
    const affected = await archivePrayer(id);
    if (affected === 0) throw notFound(); // archived meanwhile
    publish({ type: "removed", id });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error, "Failed to delete prayer");
  }
}

// Marks the caller's own prayer as answered and stores their testimony.
// Idempotent: re-calling only updates the testimony, never resets answeredAt.
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    assertSameOrigin(request);
    const { id } = await params;
    const requester = await getRequester(request.cookies);
    enforceRateLimit(`testimony:${manageKey(request, requester)}`, LIMITS.managePerRequester);

    const { testimony } = parseInput(testimonySchema, await readJson(request));
    const moderation = moderateText(testimony, { maxLen: PRAYER_MAX_CHARS });
    if (!moderation.ok) throw new HttpError(400, moderation.code!);

    const owned = await loadOwnedPrayer(id, requester);

    const [updated] = await db
      .update(prayers)
      .set({
        answeredAt: owned.answeredAt ?? new Date(),
        testimony: testimony.trim(),
      })
      .where(eq(prayers.id, id))
      .returning();
    if (!updated) throw notFound();

    const [userRow] = updated.userId
      ? await db.select({ name: user.name }).from(user).where(eq(user.id, updated.userId)).limit(1)
      : [null];

    return NextResponse.json(
      toPublicPrayer({ ...updated, userName: userRow?.name ?? null }, requester)
    );
  } catch (error) {
    return errorResponse(error, "Failed to save testimony");
  }
}
