import { and, eq, isNull, sql } from "drizzle-orm";
import { INTERCESSOR_GOAL } from "@/lib/constants";
import { db } from "@/lib/db";
import { intercessions, prayers } from "@/lib/db/schema";
import { isOwner } from "./serialize";

export type IntercedeResult =
  | { status: "prayed"; count: number; goalReached: boolean }
  | { status: "already"; count: number; goalReached: boolean }
  | { status: "own"; count: number; goalReached: boolean }
  | { status: "not_found" };

/**
 * Records one intercession and bumps the counter in a single transaction.
 * The counter only moves when a new intercession row was actually inserted,
 * so retries, double taps and the same account on two devices never inflate
 * it. The author can't count toward their own request's goal.
 */
export async function intercede(params: {
  prayerId: string;
  visitorId: string;
  userId: string | null;
}): Promise<IntercedeResult> {
  return db.transaction(async (tx) => {
    const [prayer] = await tx
      .select({
        userId: prayers.userId,
        visitorId: prayers.visitorId,
        count: prayers.intercessorCount,
        goalReached: prayers.goalReached,
      })
      .from(prayers)
      .where(and(eq(prayers.id, params.prayerId), isNull(prayers.archivedAt)))
      .limit(1);

    if (!prayer) return { status: "not_found" } as const;

    if (isOwner(prayer, { userId: params.userId, visitorId: params.visitorId })) {
      return { status: "own", count: prayer.count, goalReached: prayer.goalReached } as const;
    }

    // Any unique violation — same visitor, or same account on another
    // device — means this person already prayed: insert nothing.
    const inserted = await tx
      .insert(intercessions)
      .values({
        prayerId: params.prayerId,
        visitorId: params.visitorId,
        userId: params.userId,
      })
      .onConflictDoNothing()
      .returning({ id: intercessions.id });

    if (inserted.length === 0) {
      return { status: "already", count: prayer.count, goalReached: prayer.goalReached } as const;
    }

    const [updated] = await tx
      .update(prayers)
      .set({
        intercessorCount: sql`${prayers.intercessorCount} + 1`,
        goalReached: sql`${prayers.intercessorCount} + 1 >= ${INTERCESSOR_GOAL}`,
      })
      .where(eq(prayers.id, params.prayerId))
      .returning({ count: prayers.intercessorCount, goalReached: prayers.goalReached });

    return { status: "prayed", count: updated.count, goalReached: updated.goalReached } as const;
  });
}
