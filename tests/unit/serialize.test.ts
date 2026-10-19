import { describe, expect, it } from "vitest";
import { toPublicPrayer, type PrayerRow } from "@/lib/prayers/serialize";

function row(overrides: Partial<PrayerRow> = {}): PrayerRow {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    text: "Oren por mi familia",
    displayName: "María",
    userId: "user-a",
    visitorId: "visitor-a",
    isAnonymous: false,
    category: "family",
    intercessorCount: 2,
    goalReached: false,
    answeredAt: null,
    testimony: "Dios respondió",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    userName: "María G.",
    ...overrides,
  };
}

const stranger = { userId: null, visitorId: "visitor-z" };

describe("toPublicPrayer", () => {
  it("never exposes userId or visitorId", () => {
    const pub = toPublicPrayer(row(), stranger) as Record<string, unknown>;
    expect(pub).not.toHaveProperty("userId");
    expect(pub).not.toHaveProperty("visitorId");
  });

  it("hides every name on anonymous prayers", () => {
    const pub = toPublicPrayer(row({ isAnonymous: true }), stranger);
    expect(pub.displayName).toBeNull();
    expect(pub.userName).toBeNull();
  });

  it("only the owning account can manage and see the testimony", () => {
    const owner = toPublicPrayer(row(), { userId: "user-a", visitorId: null });
    expect(owner.canManage).toBe(true);
    expect(owner.testimony).toBe("Dios respondió");

    // Same visitor cookie but the prayer belongs to an account: not enough.
    const sameDevice = toPublicPrayer(row(), { userId: null, visitorId: "visitor-a" });
    expect(sameDevice.canManage).toBe(false);
    expect(sameDevice.testimony).toBeNull();
  });

  it("cookie-owned prayers can be managed by that visitor only", () => {
    const r = row({ userId: null });
    expect(toPublicPrayer(r, { userId: null, visitorId: "visitor-a" }).canManage).toBe(true);
    expect(toPublicPrayer(r, stranger).canManage).toBe(false);
  });
});
