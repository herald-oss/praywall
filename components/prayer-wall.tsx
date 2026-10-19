"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { PrayerCard } from "./prayer-card";
import { usePrayerStream } from "@/hooks/use-prayer-stream";
import type { PublicPrayer } from "@/lib/prayers/serialize";

// Live prepends would otherwise grow the list forever on a screen left open
// all day (e.g. a church lobby display).
const MAX_ITEMS = 100;

export function PrayerWall({ excludeId }: { excludeId?: string | null }) {
  const t = useTranslations("wall");
  const [prayers, setPrayers] = useState<PublicPrayer[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDeleted = useCallback((id: string) => {
    setPrayers((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const fetchPrayers = useCallback(async () => {
    try {
      const query = excludeId ? `?exclude=${excludeId}` : "";
      const res = await fetch(`/api/prayers${query}`);
      if (res.ok) setPrayers(await res.json());
    } catch {
      // keep what we have; the stream will resync later
    } finally {
      setLoading(false);
    }
  }, [excludeId]);

  useEffect(() => {
    // Initial load from an external source (the API).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPrayers();
  }, [fetchPrayers]);

  usePrayerStream({
    onPrayer: (prayer) => {
      if (prayer.id === excludeId) return;
      setPrayers((prev) => {
        const existing = prev.find((p) => p.id === prayer.id);
        if (existing) {
          // The broadcast is anonymized — never let it downgrade what we
          // already know about our own card.
          return prev.map((p) =>
            p.id === prayer.id
              ? { ...prayer, canManage: p.canManage, viewerHasPrayed: p.viewerHasPrayed, testimony: p.testimony }
              : p
          );
        }
        return [prayer, ...prev].slice(0, MAX_ITEMS);
      });
    },
    onCount: ({ id, intercessorCount, goalReached }) => {
      setPrayers((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, intercessorCount: Math.max(p.intercessorCount, intercessorCount), goalReached }
            : p
        )
      );
    },
    onRemoved: handleDeleted,
    onResync: fetchPrayers,
  });

  if (loading) {
    return (
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="mb-4 break-inside-avoid rounded-lg bg-card animate-pulse border border-border"
            style={{ height: `${120 + (i % 3) * 40}px` }}
          />
        ))}
      </div>
    );
  }

  if (prayers.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>{t("empty")}</p>
      </div>
    );
  }

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
      {prayers.map((prayer) => (
        <div
          key={prayer.id}
          className="mb-4 break-inside-avoid animate-in fade-in slide-in-from-top-2 duration-500"
        >
          <PrayerCard prayer={prayer} onDeleted={handleDeleted} />
        </div>
      ))}
    </div>
  );
}
