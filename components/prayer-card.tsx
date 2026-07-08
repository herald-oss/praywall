"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { HandHeart, Sparkles } from "lucide-react";
import { useState, useCallback } from "react";
import type { PublicPrayer } from "@/lib/prayers/serialize";
import { IntercessorCount } from "./intercessor-count";
import { PraySuccessDialog } from "./pray-success-dialog";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";

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

export function PrayerCard({
  prayer,
  onDeleted,
  onAnswered,
  initialHasPrayed = false,
  allowTestimony = false,
}: {
  prayer: PublicPrayer;
  onDeleted?: (id: string) => void;
  onAnswered?: (updated: PublicPrayer) => void;
  initialHasPrayed?: boolean;
  allowTestimony?: boolean;
}) {
  const t = useTranslations();
  const [count, setCount] = useState(prayer.intercessorCount ?? 0);
  const [hasPrayed, setHasPrayed] = useState(initialHasPrayed);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPraySuccess, setShowPraySuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showTestimonyForm, setShowTestimonyForm] = useState(false);
  const [testimonyText, setTestimonyText] = useState(prayer.testimony ?? "");
  const [isSavingTestimony, setIsSavingTestimony] = useState(false);

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

  const handleDelete = useCallback(async () => {
    if (isDeleting) return;
    if (!window.confirm(t("wall.delete_confirm"))) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/prayers/${prayer.id}`, {
        method: "DELETE",
      });
      if (res.ok || res.status === 404) {
        toast.success(t("wall.delete_success"));
        onDeleted?.(prayer.id);
      } else {
        toast.error(t("wall.delete_error"));
      }
    } catch {
      toast.error(t("wall.delete_error"));
    } finally {
      setIsDeleting(false);
    }
  }, [isDeleting, onDeleted, prayer.id, t]);

  const handleSaveTestimony = useCallback(async () => {
    if (isSavingTestimony || !testimonyText.trim()) return;
    setIsSavingTestimony(true);

    try {
      const res = await fetch(`/api/prayers/${prayer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testimony: testimonyText.trim() }),
      });

      if (res.ok) {
        const updated = (await res.json()) as PublicPrayer;
        toast.success(t("account.testimony_success"));
        setShowTestimonyForm(false);
        onAnswered?.(updated);
      } else {
        toast.error(t("account.testimony_error"));
      }
    } catch {
      toast.error(t("account.testimony_error"));
    } finally {
      setIsSavingTestimony(false);
    }
  }, [isSavingTestimony, testimonyText, prayer.id, onAnswered, t]);

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
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-semibold ${getAvatarColor(prayer.id)}`}
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
            {prayer.canManage && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                aria-label={t("wall.delete")}
                className="text-subtle hover:text-destructive transition-colors duration-300 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Prayer text — the protagonist */}
        <p className="text-base sm:text-lg text-foreground/90 font-normal leading-relaxed mb-4 whitespace-pre-wrap break-words">
          {prayer.text}
        </p>

        {/* Testimony — only in the owner's "Peticiones" tab, never public */}
        {allowTestimony && prayer.canManage && (
          <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
            {prayer.answeredAt && !showTestimonyForm ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="font-mono text-xs tracking-[0.1em] uppercase">
                    {t("account.answered_badge")}
                  </span>
                </div>
                {prayer.testimony && (
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap break-words">
                    {prayer.testimony}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setShowTestimonyForm(true)}
                  className="font-mono text-xs tracking-[0.1em] uppercase text-subtle hover:text-primary transition-colors duration-300"
                >
                  {t("account.edit_testimony")}
                </button>
              </div>
            ) : showTestimonyForm ? (
              <div className="space-y-2">
                <Textarea
                  value={testimonyText}
                  onChange={(e) => setTestimonyText(e.target.value)}
                  placeholder={t("account.testimony_placeholder")}
                  maxLength={280}
                  className="min-h-20 bg-background"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveTestimony}
                    disabled={isSavingTestimony || !testimonyText.trim()}
                  >
                    {t("account.testimony_save")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setShowTestimonyForm(false);
                      setTestimonyText(prayer.testimony ?? "");
                    }}
                  >
                    {t("account.cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowTestimonyForm(true)}
                className="flex items-center gap-1.5 font-mono text-xs tracking-[0.1em] uppercase text-primary hover:text-primary/80 transition-colors duration-300"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {t("account.mark_answered")}
              </button>
            )}
          </div>
        )}

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
