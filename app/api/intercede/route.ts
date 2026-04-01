import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { intercessions, prayers } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
function getVisitorId(request: NextRequest): string {
  // Use a cookie-based visitor ID for anonymous users
  const existingId = request.cookies.get("praywall_visitor")?.value;
  if (existingId) return existingId;
  return crypto.randomUUID();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prayerId } = body;

    if (!prayerId) {
      return NextResponse.json(
        { error: "prayerId is required" },
        { status: 400 }
      );
    }

    const visitorId = getVisitorId(request);

    // Insert intercession (unique constraint prevents duplicates)
    await db.insert(intercessions).values({
      prayerId,
      visitorId,
    });

    // Increment the intercessor count
    const [updated] = await db
      .update(prayers)
      .set({
        intercessorCount: sql`${prayers.intercessorCount} + 1`,
        goalReached: sql`${prayers.intercessorCount} + 1 >= 33`,
      })
      .where(eq(prayers.id, prayerId))
      .returning();

    const response = NextResponse.json({
      count: updated.intercessorCount,
      goalReached: updated.goalReached,
    });

    // Set visitor cookie if not present
    if (!request.cookies.get("praywall_visitor")) {
      response.cookies.set("praywall_visitor", visitorId, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: "/",
      });
    }

    return response;
  } catch (error: unknown) {
    // Handle unique constraint violation (already prayed)
    const pgError = error instanceof Error && "cause" in error
      ? (error.cause as { code?: string })
      : null;

    if (pgError?.code === "23505") {
      return NextResponse.json(
        { error: "You already prayed for this" },
        { status: 409 }
      );
    }

    console.error("Failed to intercede:", error);
    return NextResponse.json(
      { error: "Failed to record intercession" },
      { status: 500 }
    );
  }
}
