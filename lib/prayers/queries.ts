import { and, desc, eq, inArray, isNull, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { intercessions, prayers, user } from "@/lib/db/schema";
import type { PrayerRow, Requester } from "./serialize";

// One place for the columns every prayer read needs, including whether the
// current requester already prayed (matched by account OR visitor cookie,
// so the state survives reloads and follows the account across devices).
function prayerColumns(requester: Requester) {
  const viewerHasPrayed =
    requester.userId || requester.visitorId
      ? sql<boolean>`exists (
          select 1 from ${intercessions}
          where ${intercessions.prayerId} = ${prayers.id}
            and (${intercessions.visitorId} = ${requester.visitorId ?? ""}
              or ${intercessions.userId} = ${requester.userId ?? ""})
        )`
      : sql<boolean>`false`;

  return {
    id: prayers.id,
    text: prayers.text,
    displayName: prayers.displayName,
    userId: prayers.userId,
    visitorId: prayers.visitorId,
    isAnonymous: prayers.isAnonymous,
    category: prayers.category,
    intercessorCount: prayers.intercessorCount,
    goalReached: prayers.goalReached,
    answeredAt: prayers.answeredAt,
    testimony: prayers.testimony,
    createdAt: prayers.createdAt,
    userName: user.name,
    viewerHasPrayed,
  };
}

export const WALL_PAGE_SIZE = 30;

/** Visible prayers, fewest intercessors first, newest first (uses prayers_wall_idx). */
export async function listWall(opts: {
  requester: Requester;
  offset?: number;
  limit?: number;
  excludeId?: string | null;
}): Promise<PrayerRow[]> {
  const conditions: SQL[] = [isNull(prayers.archivedAt)];
  if (opts.excludeId) conditions.push(ne(prayers.id, opts.excludeId));

  return db
    .select(prayerColumns(opts.requester))
    .from(prayers)
    .leftJoin(user, eq(prayers.userId, user.id))
    .where(and(...conditions))
    .orderBy(prayers.intercessorCount, sql`${prayers.createdAt} desc nulls last`)
    .limit(Math.min(Math.max(opts.limit ?? WALL_PAGE_SIZE, 1), 100))
    .offset(Math.max(opts.offset ?? 0, 0));
}

/** Specific visible prayers (max 20) — used to resync cards after a stream gap. */
export async function listVisibleByIds(
  ids: string[],
  requester: Requester
): Promise<PrayerRow[]> {
  if (ids.length === 0) return [];
  return db
    .select(prayerColumns(requester))
    .from(prayers)
    .leftJoin(user, eq(prayers.userId, user.id))
    .where(and(inArray(prayers.id, ids.slice(0, 20)), isNull(prayers.archivedAt)));
}

export async function getVisiblePrayer(
  id: string,
  requester: Requester
): Promise<PrayerRow | null> {
  const [row] = await db
    .select(prayerColumns(requester))
    .from(prayers)
    .leftJoin(user, eq(prayers.userId, user.id))
    .where(and(eq(prayers.id, id), isNull(prayers.archivedAt)))
    .limit(1);
  return row ?? null;
}

/** One of the 5 oldest prayers nobody has prayed for yet, picked at random. */
export async function pickFeaturedPrayer(
  requester: Requester
): Promise<PrayerRow | null> {
  const candidates = await db
    .select(prayerColumns(requester))
    .from(prayers)
    .leftJoin(user, eq(prayers.userId, user.id))
    .where(and(eq(prayers.intercessorCount, 0), isNull(prayers.archivedAt)))
    .orderBy(prayers.createdAt)
    .limit(5);
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export async function listOwnPrayers(requester: Requester): Promise<PrayerRow[]> {
  if (!requester.userId) return [];
  return db
    .select(prayerColumns(requester))
    .from(prayers)
    .leftJoin(user, eq(prayers.userId, user.id))
    .where(and(eq(prayers.userId, requester.userId), isNull(prayers.archivedAt)))
    .orderBy(desc(prayers.createdAt))
    .limit(100);
}

/** Prayers this account (or this device's cookie) interceded for, latest first. */
export async function listIntercededPrayers(
  requester: Requester
): Promise<PrayerRow[]> {
  const mine: SQL[] = [];
  if (requester.userId) mine.push(eq(intercessions.userId, requester.userId));
  if (requester.visitorId) mine.push(eq(intercessions.visitorId, requester.visitorId));
  if (mine.length === 0) return [];

  const latest = db
    .select({
      prayerId: intercessions.prayerId,
      prayedAt: sql<Date>`max(${intercessions.createdAt})`.as("prayed_at"),
    })
    .from(intercessions)
    .where(or(...mine))
    .groupBy(intercessions.prayerId)
    .as("latest");

  return db
    .select(prayerColumns(requester))
    .from(latest)
    .innerJoin(prayers, eq(latest.prayerId, prayers.id))
    .leftJoin(user, eq(prayers.userId, user.id))
    .where(isNull(prayers.archivedAt))
    .orderBy(desc(latest.prayedAt))
    .limit(100);
}
