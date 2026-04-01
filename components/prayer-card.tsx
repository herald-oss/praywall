"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HandHeart } from "lucide-react";
import { useState, useCallback } from "react";
import type { Prayer } from "@/lib/db/schema";
import { IntercessorCount } from "./intercessor-count";
import toast from "react-hot-toast";

type PrayerWithUser = Prayer & {
  userName: string | null;
};

function getTimeAgo(date: Date, locale: string): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return locale === "es" ? "ahora mismo" : "just now";
  if (diffMins < 60)
    return locale === "es" ? `hace ${diffMins} min` : `${diffMins}m ago`;
  if (diffHours < 24)
    return locale === "es" ? `hace ${diffHours}h` : `${diffHours}h ago`;
  return locale === "es" ? `hace ${diffDays}d` : `${diffDays}d ago`;
}

function getAvatarColor(userId: string | null): string {
  const colors = [
    "bg-amber-700",
    "bg-orange-700",
    "bg-rose-700",
    "bg-red-800",
    "bg-yellow-700",
    "bg-emerald-800",
    "bg-sky-800",
    "bg-violet-800",
  ];
  if (!userId) return colors[0];
  const hash = userId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function getInitials(name: string | null, isAnonymous: boolean): string {
  if (isAnonymous || !name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function PrayerCard({ prayer }: { prayer: PrayerWithUser }) {
  const t = useTranslations();
  const [count, setCount] = useState(prayer.intercessorCount ?? 0);
  const [hasPrayed, setHasPrayed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePray = useCallback(async () => {
    if (hasPrayed || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/intercede", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prayerId: prayer.id }),
      });

      if (res.ok) {
        setCount((c) => c + 1);
        setHasPrayed(true);
        toast.success(t("wall.you_prayed"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [hasPrayed, isSubmitting, prayer.id, t]);

  function getButtonText(): string {
    if (hasPrayed) return t("wall.you_prayed");
    if (count === 0) return t("wall.be_first");
    return t("wall.prayed");
  }

  return (
    <Card className="relative overflow-hidden transition-all hover:border-primary/30">
      <CardContent className="pt-5 pb-4">
        <div className="flex gap-3">
          {/* Avatar */}
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white ${getAvatarColor(prayer.userId)}`}
          >
            {getInitials(prayer.displayName ?? prayer.userName, prayer.isAnonymous ?? false)}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-foreground">
                {prayer.isAnonymous
                  ? t("wall.anonymous")
                  : prayer.displayName ?? prayer.userName ?? t("wall.anonymous")}
              </span>
              <span className="text-xs text-muted-foreground">
                {getTimeAgo(new Date(prayer.createdAt), "es")}
              </span>
            </div>

            {/* Prayer text */}
            <p className="text-sm text-foreground/90 mb-3 whitespace-pre-wrap break-words">
              {prayer.text}
            </p>

            {/* Category badge */}
            {prayer.category && prayer.category !== "general" && (
              <Badge variant="secondary" className="mb-3 text-xs">
                {t(`categories.${prayer.category}` as Parameters<typeof t>[0])}
              </Badge>
            )}

            {/* Warm state + pray button */}
            <div className="flex items-center justify-between gap-3">
              {count > 0 && <IntercessorCount count={count} />}

              <Button
                variant={hasPrayed ? "secondary" : "default"}
                size="sm"
                onClick={handlePray}
                disabled={hasPrayed || isSubmitting}
                className="gap-1.5 shrink-0 ml-auto"
              >
                <HandHeart className="h-4 w-4" />
                {getButtonText()}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
