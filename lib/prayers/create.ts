import { and, eq, or } from "drizzle-orm";
import { DISPLAY_NAME_MAX_CHARS, PRAYER_MAX_CHARS, type PrayerCategory } from "@/lib/constants";
import { db } from "@/lib/db";
import { prayers, type Prayer } from "@/lib/db/schema";
import { HttpError } from "@/lib/http/errors";
import { moderateText } from "@/lib/moderation";

export interface CreatePrayerInput {
  text: string;
  name?: string | null;
  isAnonymous: boolean;
  category: PrayerCategory;
  clientRequestId?: string | null;
}

export interface CreatePrayerRequester {
  userId: string | null;
  userName: string | null;
  visitorId: string;
}

/**
 * Validates, moderates and inserts a prayer. Returns the row and whether it
 * was a duplicate of an earlier submit with the same clientRequestId.
 */
export async function createPrayer(
  input: CreatePrayerInput,
  requester: CreatePrayerRequester
): Promise<{ row: Prayer; isDuplicate: boolean }> {
  const text = input.text.trim();
  const moderation = moderateText(input.text, { maxLen: PRAYER_MAX_CHARS, checkSpam: true });
  if (!moderation.ok) throw new HttpError(400, moderation.code!);

  // Logged-in users always post under their account name — the client can't
  // pick a different one (that would allow impersonation).
  let displayName: string | null = null;
  if (!input.isAnonymous) {
    if (requester.userId) {
      displayName = requester.userName;
    } else {
      const name = (input.name ?? "").trim();
      if (name) {
        const nameCheck = moderateText(name, { maxLen: DISPLAY_NAME_MAX_CHARS });
        if (!nameCheck.ok) throw new HttpError(400, nameCheck.code!);
        displayName = name;
      }
    }
  }

  const clientRequestId = input.clientRequestId ?? null;

  const [inserted] = await db
    .insert(prayers)
    .values({
      text,
      displayName,
      isAnonymous: input.isAnonymous,
      category: input.category,
      visitorId: requester.visitorId,
      userId: requester.userId,
      clientRequestId,
    })
    .onConflictDoNothing({ target: prayers.clientRequestId })
    .returning();

  if (inserted) return { row: inserted, isDuplicate: false };
  if (!clientRequestId) throw new HttpError(500, "server_error");

  // Same clientRequestId already used — a double submit or retry. Only hand
  // back the existing row to the same requester; someone replaying another
  // person's id must not get that prayer (or its ownership flags) back.
  const sameRequester = requester.userId
    ? or(eq(prayers.userId, requester.userId), eq(prayers.visitorId, requester.visitorId))
    : eq(prayers.visitorId, requester.visitorId);
  const [existing] = await db
    .select()
    .from(prayers)
    .where(and(eq(prayers.clientRequestId, clientRequestId), sameRequester))
    .limit(1);
  if (!existing) throw new HttpError(409, "invalid_input");
  return { row: existing, isDuplicate: true };
}
