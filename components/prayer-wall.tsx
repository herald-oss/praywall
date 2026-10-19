"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PrayerCard } from "./prayer-card";
import { useLiveState } from "./live-prayers";
import type { PublicPrayer } from "@/lib/prayers/serialize";

// Live prepends would otherwise grow the list forever on a screen left open
// all day (e.g. a church lobby display).
const MAX_ITEMS = 100;

export function PrayerWall({ excludeId }: { excludeId?: string | null }) {
  const t = useTranslations("wall");
  const live = useLiveState();
  const [loaded, setLoaded] = useState<PublicPrayer[]>([]);
  const [deleted, setDeleted] = useState<ReadonlySet<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const resyncKey = live?.resyncKey ?? 0;

  const handleDeleted = useCallback((id: string) => {
    setDeleted((prev) => new Set(prev).add(id));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const query = excludeId ? `?exclude=${excludeId}` : "";
    fetch(`/api/prayers${query}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PublicPrayer[] | null) => {
        if (!cancelled && data) setLoaded(data);
      })
      .catch(() => {
        // keep what we have; the stream will trigger another resync
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [excludeId, resyncKey]);

  const prayers = useMemo(() => {
    const known = new Map(loaded.map((p) => [p.id, p]));
    const fresh = (live?.incoming ?? []).filter((p) => !known.has(p.id));
    return [...fresh, ...loaded]
      .filter((p) => p.id !== excludeId && !deleted.has(p.id) && !live?.removed.has(p.id))
      .slice(0, MAX_ITEMS);
  }, [loaded, live, excludeId, deleted]);

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
