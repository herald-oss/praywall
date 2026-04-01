"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HandHeart } from "lucide-react";
import { useState, useCallback } from "react";
import type { Prayer } from "@/lib/db/schema";
import { IntercessorCount } from "./intercessor-count";
import { PraySuccessDialog } from "./pray-success-dialog";

type PrayerWithUser = Prayer & {
  userName: string | null;
};

function getTimeAgo(date: Date, locale: string): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return locale === "es" ? "ahora" : "now";
  if (diffMins < 60)
    return locale === "es" ? `${diffMins}m` : `${diffMins}m`;
  if (diffHours < 24)
    return locale === "es" ? `${diffHours}h` : `${diffHours}h`;
  return locale === "es" ? `${diffDays}d` : `${diffDays}d`;
}

function getAvatarColor(id: string | null): string {
  const colors = [
    "bg-primary/20 text-primary",
    "bg-primary/15 text-primary/80",
    "bg-primary/25 text-primary/90",
    "bg-primary/10 text-primary/70",
  ];
  if (!id) return colors[0];
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function getInitials(name: string | null, isAnonymous: boolean): string {
  if (isAnonymous || !name) return "?";
  return name.charAt(0).toUpperCase();
}

export function PrayerCard({ prayer }: { prayer: PrayerWithUser }) {
  const t = useTranslations();
  const [count, setCount] = useState(prayer.intercessorCount ?? 0);
  const [hasPrayed, setHasPrayed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPraySuccess, setShowPraySuccess] = useState(false);

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
        setShowPraySuccess(true);
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

  const displayName = prayer.isAnonymous
    ? t("wall.anonymous")
    : prayer.displayName ?? prayer.userName ?? t("wall.anonymous");

  return (
    <Card className="relative overflow-hidden transition-all duration-300 hover:border-primary/20 hover:shadow-[0_0_30px_rgba(var(--glow-color),0.06)]">
      <CardContent className="p-6">
        {/* Header — monospace meta */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-semibold ${getAvatarColor(prayer.userId ?? prayer.id)}`}
            >
              {getInitials(prayer.displayName ?? prayer.userName, prayer.isAnonymous ?? false)}
            </div>
            <span className="font-mono text-xs tracking-[0.1em] text-subtle uppercase">
              {displayName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {prayer.category && prayer.category !== "general" && (
              <span className="font-mono text-xs tracking-[0.1em] uppercase text-subtle border border-border rounded px-2 py-0.5">
                {t(`categories.${prayer.category}` as Parameters<typeof t>[0])}
              </span>
            )}
            <span className="font-mono text-xs tracking-[0.1em] text-subtle">
              {getTimeAgo(new Date(prayer.createdAt), "es")}
            </span>
          </div>
        </div>

        {/* Prayer text — the protagonist */}
        <p className="text-base sm:text-lg text-foreground/90 font-normal leading-relaxed mb-4 whitespace-pre-wrap break-words">
          {prayer.text}
        </p>

        {/* Footer — warm state + action */}
        <div className="flex items-center justify-between gap-3">
          {count > 0 && <IntercessorCount count={count} />}

          <Button
            variant={hasPrayed ? "secondary" : "default"}
            size="default"
            onClick={handlePray}
            disabled={hasPrayed || isSubmitting}
            aria-pressed={hasPrayed}
            className="gap-2 shrink-0 ml-auto text-base tracking-wide transition-all duration-300"
          >
            <HandHeart className="h-3.5 w-3.5" />
            {getButtonText()}
          </Button>
        </div>
      </CardContent>
      <PraySuccessDialog
        open={showPraySuccess}
        onOpenChange={setShowPraySuccess}
      />
    </Card>
  );
}
