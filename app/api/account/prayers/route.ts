import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prayers, user, intercessions } from "@/lib/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { toPublicPrayers } from "@/lib/prayers/serialize";

// Requires a logged-in session — this is account-scoped data, not public.
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const visitorId = request.cookies.get("praywall_visitor")?.value ?? null;
    const requester = { userId: session.user.id, visitorId };

    const myRows = await db
      .select({
        id: prayers.id,
        text: prayers.text,
        userId: prayers.userId,
        visitorId: prayers.visitorId,
        isAnonymous: prayers.isAnonymous,
        category: prayers.category,
        displayName: prayers.displayName,
        intercessorCount: prayers.intercessorCount,
        goalReached: prayers.goalReached,
        answeredAt: prayers.answeredAt,
        testimony: prayers.testimony,
        createdAt: prayers.createdAt,
        userName: user.name,
      })
      .from(prayers)
      .leftJoin(user, eq(prayers.userId, user.id))
      .where(and(eq(prayers.userId, session.user.id), isNull(prayers.archivedAt)))
      .orderBy(desc(prayers.createdAt))
      .limit(100);

    // intercessions never records userId (only the visitorId cookie present
    // at the time), so "prayers I interceded for" can only be matched via
    // that cookie — not via the logged-in session.
    let intercededRows: typeof myRows = [];
    if (visitorId) {
      intercededRows = await db
        .select({
          id: prayers.id,
          text: prayers.text,
          userId: prayers.userId,
          visitorId: prayers.visitorId,
          isAnonymous: prayers.isAnonymous,
          category: prayers.category,
          displayName: prayers.displayName,
          intercessorCount: prayers.intercessorCount,
          goalReached: prayers.goalReached,
          answeredAt: prayers.answeredAt,
          testimony: prayers.testimony,
          createdAt: prayers.createdAt,
          userName: user.name,
        })
        .from(intercessions)
        .innerJoin(prayers, eq(intercessions.prayerId, prayers.id))
        .leftJoin(user, eq(prayers.userId, user.id))
        .where(and(eq(intercessions.visitorId, visitorId), isNull(prayers.archivedAt)))
        .orderBy(desc(intercessions.createdAt))
        .limit(100);
    }

    return NextResponse.json({
      myPrayers: toPublicPrayers(myRows, requester),
      intercededPrayers: toPublicPrayers(intercededRows, requester),
    });
  } catch (error) {
    console.error("Failed to fetch account prayers:", error);
    return NextResponse.json(
      { error: "Failed to fetch account prayers" },
      { status: 500 }
    );
  }
}
