import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { prayers, user } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { archivePrayer } from "@/lib/prayers/archive";
import { moderateText } from "@/lib/moderation";
import { PRAYER_MAX_CHARS } from "@/lib/constants";
import { toPublicPrayer } from "@/lib/prayers/serialize";

// Same body for "doesn't exist" and "not yours" — never reveal whether a
// prayer id exists to someone who isn't its owner.
function notFound() {
  return NextResponse.json({ error: "not_found" }, { status: 404 });
}

// Only what's needed for the ownership check. Never trust identity sent by
// the client (body/query) — always derive it from session/cookie.
async function loadOwnedPrayer(
  id: string,
  requesterUserId: string | null,
  requesterVisitorId: string | null
) {
  const [row] = await db
    .select({
      id: prayers.id,
      userId: prayers.userId,
      visitorId: prayers.visitorId,
      archivedAt: prayers.archivedAt,
      answeredAt: prayers.answeredAt,
    })
    .from(prayers)
    .where(eq(prayers.id, id))
    .limit(1);

  if (!row || row.archivedAt != null) return null;

  let owns = false;
  if (row.userId != null) {
    owns = requesterUserId != null && requesterUserId === row.userId;
  } else if (row.visitorId != null) {
    owns = requesterVisitorId != null && requesterVisitorId === row.visitorId;
  }
  return owns ? row : null;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  const visitorId = request.cookies.get("praywall_visitor")?.value ?? null;

  const rateLimitKey = `delete:${session?.user?.id ?? visitorId ?? "anon"}`;
  const rateLimit = checkRateLimit(rateLimitKey, { limit: 10, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limit" },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSec) },
      }
    );
  }

  const owned = await loadOwnedPrayer(id, session?.user?.id ?? null, visitorId);
  if (!owned) return notFound();

  const affected = await archivePrayer(id);
  if (affected === 0) return notFound(); // race: archived by someone else meanwhile

  return new NextResponse(null, { status: 204 });
}

// Marks the caller's own prayer as answered and stores their testimony text.
// Idempotent: re-calling only updates the testimony text, never resets
// answeredAt once set.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  const visitorId = request.cookies.get("praywall_visitor")?.value ?? null;

  const rateLimitKey = `testimony:${session?.user?.id ?? visitorId ?? "anon"}`;
  const rateLimit = checkRateLimit(rateLimitKey, { limit: 10, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limit" },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSec) },
      }
    );
  }

  const body = await request.json().catch(() => null);
  const testimony = typeof body?.testimony === "string" ? body.testimony : "";

  const moderation = moderateText(testimony, { maxLen: PRAYER_MAX_CHARS });
  if (!moderation.ok) {
    return NextResponse.json({ error: moderation.code }, { status: 400 });
  }

  const owned = await loadOwnedPrayer(id, session?.user?.id ?? null, visitorId);
  if (!owned) return notFound();

  const [updated] = await db
    .update(prayers)
    .set({
      answeredAt: owned.answeredAt ?? new Date(), // set once, kept on re-calls
      testimony: testimony.trim(),
    })
    .where(eq(prayers.id, id))
    .returning();

  if (!updated) return notFound();

  const [userRow] = updated.userId
    ? await db
        .select({ name: user.name })
        .from(user)
        .where(eq(user.id, updated.userId))
        .limit(1)
    : [null];

  return NextResponse.json(
    toPublicPrayer(
      { ...updated, userName: userRow?.name ?? null },
      { userId: session?.user?.id ?? null, visitorId }
    )
  );
}
