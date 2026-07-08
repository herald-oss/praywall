import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prayers, user } from "@/lib/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { notifySSEClients } from "../prayers/stream/route";
import { containsProfanity, moderateText } from "@/lib/moderation";
import { PRAYER_MAX_CHARS } from "@/lib/constants";
import { checkRateLimit } from "@/lib/rate-limit";

const PRAYER_CATEGORIES = [
  "general",
  "health",
  "family",
  "work",
  "spiritual",
  "gratitude",
];

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
    const {
      text,
      name,
      isAnonymous = true,
      category = "general",
      clientRequestId,
    } = body;

    // Get or create visitor ID
    const existingVisitorId = request.cookies.get("praywall_visitor")?.value;
    const visitorId = existingVisitorId || crypto.randomUUID();

    const rateLimit = checkRateLimit(visitorId, { limit: 5, windowMs: 60_000 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "rate_limit" },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSec) },
        }
      );
    }

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "empty" }, { status: 400 });
    }

    const moderation = moderateText(text, {
      maxLen: PRAYER_MAX_CHARS,
      checkSpam: true,
    });
    if (!moderation.ok) {
      return NextResponse.json({ error: moderation.code }, { status: 400 });
    }

    const safeCategory = PRAYER_CATEGORIES.includes(category)
      ? category
      : "general";

    if (!isAnonymous && typeof name === "string" && containsProfanity(name)) {
      return NextResponse.json(
        { error: "inappropriate_content" },
        { status: 400 }
      );
    }

    const dedupeKey =
      typeof clientRequestId === "string" && clientRequestId.length > 0
        ? clientRequestId
        : null;

    const [inserted] = await db
      .insert(prayers)
      .values({
        text: text.trim(),
        displayName: isAnonymous ? null : (name?.trim()?.slice(0, 30) || null),
        isAnonymous,
        category: safeCategory,
        visitorId,
        clientRequestId: dedupeKey,
      })
      .onConflictDoNothing({ target: prayers.clientRequestId })
      .returning();

    let newPrayer = inserted;
    let isDuplicate = false;

    // Same clientRequestId already inserted (e.g. double-submit) — return
    // the existing row instead of inserting a second one.
    if (!newPrayer && dedupeKey) {
      const [existing] = await db
        .select()
        .from(prayers)
        .where(eq(prayers.clientRequestId, dedupeKey))
        .limit(1);
      newPrayer = existing;
      isDuplicate = true;
    }

    if (!newPrayer) {
      return NextResponse.json(
        { error: "Failed to create prayer" },
        { status: 500 }
      );
    }

    // Notify SSE clients only for genuinely new prayers
    if (!isDuplicate) {
      const prayerWithUser = { ...newPrayer, userName: null };
      notifySSEClients(prayerWithUser);
    }

    const response = NextResponse.json(newPrayer, { status: 201 });

    // Set visitor cookie if not present
    if (!existingVisitorId) {
      response.cookies.set("praywall_visitor", visitorId, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Failed to create prayer:", error);
    return NextResponse.json(
      { error: "Failed to create prayer" },
      { status: 500 }
    );
  }
}
