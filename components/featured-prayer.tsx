"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { PrayerCard } from "./prayer-card";
import { useLiveState } from "./live-prayers";
import type { PublicPrayer } from "@/lib/prayers/serialize";

/** The hero's featured prayer; disappears if it's deleted (here or live). */
export function FeaturedPrayer({ prayer }: { prayer: PublicPrayer }) {
  const t = useTranslations("hero");
  const live = useLiveState();
  const [deleted, setDeleted] = useState(false);
  if (deleted || live?.removed.has(prayer.id)) return null;

  return (
    <div>
      <p className="font-mono text-xs tracking-[0.1em] uppercase text-subtle mb-4">
        {t("featured_title")}
      </p>
      <PrayerCard prayer={prayer} onDeleted={() => setDeleted(true)} />
    </div>
  );
}
