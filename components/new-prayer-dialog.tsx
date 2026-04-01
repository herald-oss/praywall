"use client";

import { useTranslations } from "next-intl";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Send } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

const MAX_CHARS = 280;

const CATEGORIES = [
  "general",
  "health",
  "family",
  "work",
  "spiritual",
  "gratitude",
] as const;

export function NewPrayerDialog({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [category, setCategory] = useState<string>("general");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const charsLeft = MAX_CHARS - text.length;

  function resetForm() {
    setText("");
    setName("");
    setIsAnonymous(true);
    setCategory("general");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/prayers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          name: isAnonymous ? null : name.trim() || null,
          isAnonymous,
          category,
        }),
      });

      if (res.ok) {
        toast.success(t("form.success"));
        resetForm();
        setOpen(false);
      } else {
        toast.error(t("form.error"));
      }
    } catch {
      toast.error(t("form.error"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-mono text-xs tracking-[0.1em] uppercase font-medium text-primary-foreground transition-all duration-300 hover:bg-primary/80 hover:shadow-[0_0_20px_rgba(var(--glow-color),0.3)]" />
        }
      >
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-[-0.04em]">
            {t("wall.new_prayer")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Prayer text */}
          <div className="relative">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
              placeholder={t("form.placeholder")}
              className="min-h-[120px] resize-none text-base font-normal leading-relaxed"
              maxLength={MAX_CHARS}
            />
            <span
              aria-live="polite"
              className={`absolute bottom-2 right-3 font-mono text-xs tracking-[0.1em] ${
                charsLeft < 30 ? "text-destructive" : "text-subtle"
              }`}
            >
              {charsLeft}
            </span>
          </div>

          {/* Anonymous toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded border-border accent-primary"
            />
            <span className="font-mono text-xs tracking-[0.1em] text-muted-foreground">
              {t("form.anonymous_toggle")}
            </span>
          </label>

          {/* Name field — only when not anonymous */}
          {!isAnonymous && (
            <div>
              <label className="font-mono text-xs tracking-[0.1em] uppercase text-subtle mb-2 block">
                {t("form.name_label")}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 30))}
                placeholder={t("form.name_placeholder")}
                maxLength={30}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
              />
            </div>
          )}

          {/* Category selector */}
          <details className="group">
            <summary className="font-mono text-xs tracking-[0.1em] uppercase text-subtle cursor-pointer hover:text-muted-foreground transition-colors duration-300 list-none flex items-center gap-1.5">
              <span className="group-open:rotate-90 transition-transform duration-300">
                &#9654;
              </span>
              {t("form.category")}
              {category !== "general" && (
                <span className="border border-border rounded px-1.5 py-0.5 ml-1">
                  {t(`categories.${category}`)}
                </span>
              )}
            </summary>
            <div className="flex flex-wrap gap-2 mt-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`font-mono text-xs tracking-[0.1em] uppercase px-3 py-2 rounded border transition-all duration-300 ${
                    category === cat
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border text-subtle hover:text-muted-foreground hover:border-muted-foreground/30"
                  }`}
                >
                  {t(`categories.${cat}`)}
                </button>
              ))}
            </div>
          </details>

          <Button
            type="submit"
            size="lg"
            className="w-full gap-2 font-mono text-xs tracking-[0.1em] uppercase transition-all duration-300 hover:shadow-[0_0_20px_rgba(var(--glow-color),0.3)]"
            disabled={!text.trim() || isSubmitting}
          >
            <Send className="h-3.5 w-3.5" />
            {t("form.submit")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
