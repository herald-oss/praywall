"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PrayerCard } from "./prayer-card";
import { useLiveState } from "./live-prayers";
import type { PublicPrayer } from "@/lib/prayers/serialize";

const PAGE_SIZE = 30; // matches WALL_PAGE_SIZE on the server
// The wall shows at most this many prayers — those that most need prayer
// (fewest intercessors first). Also bounds memory on screens left open
// all day (e.g. a church lobby display).
const MAX_ITEMS = 100;

export function PrayerWall({ excludeId }: { excludeId?: string | null }) {
  const t = useTranslations("wall");
  const live = useLiveState();
  const [loaded, setLoaded] = useState<PublicPrayer[]>([]);
  const [deleted, setDeleted] = useState<ReadonlySet<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const resyncKey = live?.resyncKey ?? 0;
  // How many rows to reload on a resync, so "load more" pages survive it.
  const loadedCount = useRef(PAGE_SIZE);

  const query = useCallback(
    (offset: number, limit: number) => {
      const params = new URLSearchParams({ offset: String(offset), limit: String(limit) });
      if (excludeId) params.set("exclude", excludeId);
      return fetch(`/api/prayers?${params}`).then((res) =>
        res.ok ? (res.json() as Promise<PublicPrayer[]>) : null
      );
    },
    [excludeId]
  );

  useEffect(() => {
    let cancelled = false;
    const limit = Math.max(PAGE_SIZE, Math.min(loadedCount.current, MAX_ITEMS));
    query(0, limit)
      .then((data) => {
        if (cancelled || !data) return;
        setLoaded(data);
        setHasMore(data.length === limit && data.length < MAX_ITEMS);
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
  }, [query, resyncKey]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const data = await query(loaded.length, PAGE_SIZE);
      if (!data) return;
      setLoaded((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const next = [...prev, ...data.filter((p) => !seen.has(p.id))].slice(0, MAX_ITEMS);
        loadedCount.current = next.length;
        return next;
      });
      setHasMore(data.length === PAGE_SIZE && loaded.length + data.length < MAX_ITEMS);
    } catch {
      // the button stays; the user can try again
    } finally {
      setLoadingMore(false);
    }
  }, [query, loaded.length]);

  const handleDeleted = useCallback((id: string) => {
    setDeleted((prev) => new Set(prev).add(id));
  }, []);

  const prayers = useMemo(() => {
    const known = new Set(loaded.map((p) => p.id));
    const fresh = (live?.incoming ?? []).filter((p) => !known.has(p.id));
    return [...fresh, ...loaded]
      .filter((p) => p.id !== excludeId && !deleted.has(p.id) && !live?.removed.has(p.id))
      .slice(0, MAX_ITEMS);
  }, [loaded, live, excludeId, deleted]);

  if (loading) {
    return (
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4" aria-busy="true">
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
    <>
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
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" size="lg" onClick={loadMore} disabled={loadingMore}>
            {t("load_more")}
          </Button>
        </div>
      )}
    </>
  );
}
