"use client";

import { useEffect, useRef } from "react";
import type { PublicPrayer } from "@/lib/prayers/serialize";

export interface PrayerStreamHandlers {
  onPrayer: (prayer: PublicPrayer) => void;
  onCount: (update: { id: string; intercessorCount: number; goalReached: boolean }) => void;
  onRemoved: (id: string) => void;
  /** Called after any gap in the stream, so the caller can resync. */
  onResync: () => void;
}

const MIN_BACKOFF_MS = 3_000;
const MAX_BACKOFF_MS = 60_000;

/**
 * Subscribes to the wall's live events and keeps the subscription alive:
 * - never closes on a transient error — EventSource reconnects by itself
 *   (the server ends each stream before Railway's 15-minute cut);
 * - if the browser gives up (e.g. a 503), retries with backoff;
 * - disconnects while the tab is hidden (no idle server connections) and
 *   resyncs when it's visible again.
 */
export function usePrayerStream(handlers: PrayerStreamHandlers) {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    let source: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let backoff = MIN_BACKOFF_MS;
    let needsResync = false;
    let disposed = false;

    const parse = <T,>(event: MessageEvent): T | null => {
      try {
        return JSON.parse(event.data) as T;
      } catch {
        return null;
      }
    };

    const disconnect = () => {
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = null;
      source?.close();
      source = null;
    };

    const connect = () => {
      if (disposed || source) return;
      const es = new EventSource("/api/prayers/stream");
      source = es;

      es.addEventListener("open", () => {
        backoff = MIN_BACKOFF_MS;
        if (needsResync) {
          needsResync = false;
          handlersRef.current.onResync();
        }
      });
      es.addEventListener("prayer", (e) => {
        const prayer = parse<PublicPrayer>(e as MessageEvent);
        if (prayer) handlersRef.current.onPrayer(prayer);
      });
      es.addEventListener("count", (e) => {
        const update = parse<{ id: string; intercessorCount: number; goalReached: boolean }>(
          e as MessageEvent
        );
        if (update) handlersRef.current.onCount(update);
      });
      es.addEventListener("removed", (e) => {
        const data = parse<{ id: string }>(e as MessageEvent);
        if (data) handlersRef.current.onRemoved(data.id);
      });
      es.addEventListener("error", () => {
        needsResync = true;
        if (es.readyState === EventSource.CLOSED) {
          disconnect();
          retryTimer = setTimeout(connect, backoff);
          backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
        }
      });
    };

    const onVisibility = () => {
      if (document.hidden) {
        disconnect();
        needsResync = true;
      } else {
        connect();
      }
    };

    if (!document.hidden) connect();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibility);
      disconnect();
    };
  }, []);
}
