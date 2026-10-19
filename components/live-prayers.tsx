"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePrayerStream } from "@/hooks/use-prayer-stream";
import type { PublicPrayer } from "@/lib/prayers/serialize";

// One live subscription per page, shared by every card on it (the featured
// prayer and the wall), so they all reflect counts and removals in real time.

const MAX_INCOMING = 100;

export interface LiveState {
  /** Latest known counts. Counts only grow, so keeping them across resyncs is safe. */
  counts: ReadonlyMap<string, { intercessorCount: number; goalReached: boolean }>;
  removed: ReadonlySet<string>;
  /** Prayers that arrived live since the last (re)load, newest first. */
  incoming: readonly PublicPrayer[];
  /** Bumps after any gap in the stream; lists should refetch. */
  resyncKey: number;
}

const LiveContext = createContext<LiveState | null>(null);

/**
 * `watchIds`: prayers shown outside a self-refreshing list (the featured
 * prayer, the detail page). After any stream gap their counts are reloaded
 * in one request so a missed event never leaves them stale.
 */
export function LivePrayersProvider({
  children,
  watchIds = [],
}: {
  children: ReactNode;
  watchIds?: string[];
}) {
  const watchKey = watchIds.join(",");
  const watchRef = useRef(watchKey);
  useEffect(() => {
    watchRef.current = watchKey;
  }, [watchKey]);
  const [state, setState] = useState<LiveState>({
    counts: new Map(),
    removed: new Set(),
    incoming: [],
    resyncKey: 0,
  });

  usePrayerStream({
    onPrayer: (prayer) =>
      setState((s) => ({
        ...s,
        incoming: [prayer, ...s.incoming.filter((p) => p.id !== prayer.id)].slice(0, MAX_INCOMING),
      })),
    onCount: ({ id, intercessorCount, goalReached }) =>
      setState((s) => {
        const counts = new Map(s.counts);
        counts.set(id, { intercessorCount, goalReached });
        return { ...s, counts };
      }),
    onRemoved: (id) =>
      setState((s) => {
        const removed = new Set(s.removed);
        removed.add(id);
        return { ...s, removed };
      }),
    onResync: () => {
      setState((s) => ({ ...s, incoming: [], resyncKey: s.resyncKey + 1 }));
      const key = watchRef.current;
      if (!key) return;
      const ids = key.split(",");
      fetch(`/api/prayers?ids=${key}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((fresh: PublicPrayer[] | null) => {
          if (!fresh) return;
          setState((s) => {
            const counts = new Map(s.counts);
            const removed = new Set(s.removed);
            for (const p of fresh) {
              counts.set(p.id, { intercessorCount: p.intercessorCount, goalReached: p.goalReached });
            }
            for (const id of ids) if (!fresh.some((p) => p.id === id)) removed.add(id);
            return { ...s, counts, removed };
          });
        })
        .catch(() => {});
    },
  });

  return <LiveContext.Provider value={state}>{children}</LiveContext.Provider>;
}

/** Live state, or null outside a provider (e.g. the account page). */
export function useLiveState(): LiveState | null {
  return useContext(LiveContext);
}

/** Merges live count/goal into a prayer. */
export function withLiveCount(prayer: PublicPrayer, live: LiveState | null): PublicPrayer {
  const update = live?.counts.get(prayer.id);
  if (!update || update.intercessorCount <= prayer.intercessorCount) return prayer;
  return { ...prayer, intercessorCount: update.intercessorCount, goalReached: update.goalReached };
}
