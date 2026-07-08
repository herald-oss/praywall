"use client";

import { useTranslations } from "next-intl";
import { PrayerCard } from "./prayer-card";
import { useEffect, useState, useCallback } from "react";
import type { PublicPrayer } from "@/lib/prayers/serialize";

export function PrayerWall() {
  const t = useTranslations("wall");
  const [prayers, setPrayers] = useState<PublicPrayer[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDeleted = useCallback((id: string) => {
    setPrayers((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const fetchPrayers = useCallback(async () => {
    try {
      const res = await fetch("/api/prayers");
      if (res.ok) {
        const data = await res.json();
        setPrayers(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrayers();
  }, [fetchPrayers]);

  // SSE for real-time updates
  useEffect(() => {
    const eventSource = new EventSource("/api/prayers/stream");

    eventSource.onmessage = (event) => {
      try {
        const newPrayer = JSON.parse(event.data) as PublicPrayer;
        setPrayers((prev) => {
          // Update existing prayer or prepend new one. The SSE broadcast is
          // always anonymized (canManage:false) — never let it downgrade a
          // card we already know is ours from an authoritative source
          // (the initial GET or our own POST response).
          const existing = prev.find((p) => p.id === newPrayer.id);
          if (existing) {
            const merged = {
              ...newPrayer,
              canManage: existing.canManage || newPrayer.canManage,
            };
            return prev.map((p) => (p.id === newPrayer.id ? merged : p));
          }
          return [newPrayer, ...prev];
        });
      } catch {
        // ignore parse errors
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      // Reconnect after 5s
      setTimeout(() => {
        fetchPrayers();
      }, 5000);
    };

    return () => eventSource.close();
  }, [fetchPrayers]);

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
