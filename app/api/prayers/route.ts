import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prayers, user } from "@/lib/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { notifySSEClients } from "../prayers/stream/route";

export async function GET() {
  try {
    const results = await db
      .select({
        id: prayers.id,
        text: prayers.text,
        userId: prayers.userId,
        isAnonymous: prayers.isAnonymous,
        category: prayers.category,
        displayName: prayers.displayName,
        intercessorCount: prayers.intercessorCount,
        goalReached: prayers.goalReached,
        answeredAt: prayers.answeredAt,
        createdAt: prayers.createdAt,
        userName: user.name,
      })
      .from(prayers)
      .leftJoin(user, eq(prayers.userId, user.id))
      .orderBy(asc(prayers.intercessorCount), desc(prayers.createdAt))
      .limit(50);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Failed to fetch prayers:", error);
    return NextResponse.json(
      { error: "Failed to fetch prayers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, name, isAnonymous = true, category = "general" } = body;

    if (!text || typeof text !== "string" || text.length > 280) {
      return NextResponse.json(
        { error: "Prayer text is required and must be 280 characters or less" },
        { status: 400 }
      );
    }

    const [newPrayer] = await db
      .insert(prayers)
      .values({
        text: text.trim(),
        displayName: isAnonymous ? null : (name?.trim()?.slice(0, 30) || null),
        isAnonymous,
        category,
      })
      .returning();

    // Notify SSE clients
    const prayerWithUser = { ...newPrayer, userName: null };
    notifySSEClients(prayerWithUser);

    return NextResponse.json(newPrayer, { status: 201 });
  } catch (error) {
    console.error("Failed to create prayer:", error);
    return NextResponse.json(
      { error: "Failed to create prayer" },
      { status: 500 }
    );
  }
}
