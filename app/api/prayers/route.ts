import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prayers, user } from "@/lib/db/schema";
import { asc, desc, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { notifySSEClients } from "../prayers/stream/route";
import { containsProfanity, moderateText } from "@/lib/moderation";
import { PRAYER_MAX_CHARS } from "@/lib/constants";
import { checkRateLimit } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";
import { toPublicPrayer, toPublicPrayers } from "@/lib/prayers/serialize";

const PRAYER_CATEGORIES = [
  "general",
  "health",
  "family",
  "work",
  "spiritual",
  "gratitude",
];

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const visitorId = request.cookies.get("praywall_visitor")?.value ?? null;

    const results = await db
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
      .where(isNull(prayers.archivedAt))
      .orderBy(asc(prayers.intercessorCount), desc(prayers.createdAt))
      .limit(50);

    const publicResults = toPublicPrayers(results, {
      userId: session?.user?.id ?? null,
      visitorId,
    });

    return NextResponse.json(publicResults);
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

    // Attach the account server-side when logged in, so the prayer shows up
    // under the user's account regardless of isAnonymous (which only
    // controls display, not ownership/account-linking).
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id ?? null;

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
        userId,
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

    // Notify SSE clients only for genuinely new prayers. Broadcast is
    // anonymous to every connected client — canManage is always false here,
    // never the author's own identity (that only goes in the direct response
    // below).
    if (!isDuplicate) {
      notifySSEClients(
        toPublicPrayer(
          { ...newPrayer, userName: null },
          { userId: null, visitorId: null }
        )
      );
    }

    const response = NextResponse.json(
      toPublicPrayer(
        { ...newPrayer, userName: null },
        { userId: newPrayer.userId, visitorId }
      ),
      { status: 201 }
    );

    // Set visitor cookie if not present
    if (!existingVisitorId) {
      response.cookies.set("praywall_visitor", visitorId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
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
