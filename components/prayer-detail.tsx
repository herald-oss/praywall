"use client";

import { useRouter } from "@/i18n/navigation";
import { PrayerCard } from "./prayer-card";
import type { PublicPrayer } from "@/lib/prayers/serialize";

/** Detail-page card: after deleting it there's nothing left to show here. */
export function PrayerDetail({ prayer }: { prayer: PublicPrayer }) {
  const router = useRouter();
  return <PrayerCard prayer={prayer} onDeleted={() => router.replace("/")} />;
}
