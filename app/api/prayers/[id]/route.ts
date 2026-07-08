import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { prayers } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { archivePrayer } from "@/lib/prayers/archive";

// Same body for "doesn't exist" and "not yours" — never reveal whether a
// prayer id exists to someone who isn't its owner.
function notFound() {
  return NextResponse.json({ error: "not_found" }, { status: 404 });
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

  // Only what's needed for the ownership check. Never trust identity sent
  // by the client (body/query) — always derive it from session/cookie.
  const [row] = await db
    .select({
      id: prayers.id,
      userId: prayers.userId,
      visitorId: prayers.visitorId,
      archivedAt: prayers.archivedAt,
    })
    .from(prayers)
    .where(eq(prayers.id, id))
    .limit(1);

  if (!row || row.archivedAt != null) return notFound();

  let owns = false;
  if (row.userId != null) {
    owns = session?.user?.id != null && session.user.id === row.userId;
  } else if (row.visitorId != null) {
    owns = visitorId != null && visitorId === row.visitorId;
  }
  if (!owns) return notFound();

  const affected = await archivePrayer(id);
  if (affected === 0) return notFound(); // race: archived by someone else meanwhile

  return new NextResponse(null, { status: 204 });
}
