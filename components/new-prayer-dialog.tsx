"use client";

import { useTranslations } from "next-intl";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

export function NewPrayerDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [category, setCategory] = useState<string>("general");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const charsLeft = MAX_CHARS - text.length;

  function resetForm() {
    setText("");
    setName("");
    setIsAnonymous(false);
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
    <>
      <Button
        onClick={() => setOpen(true)}
        className="gap-2 font-mono text-xs tracking-[0.1em] uppercase transition-all duration-300 hover:shadow-[0_0_20px_rgba(var(--glow-color),0.3)]"
      >
        {children}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-[-0.04em]">
            {t("wall.new_prayer")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Prayer text */}
          <div className="relative">
            <label htmlFor="prayer-text" className="sr-only">
              {t("form.placeholder")}
            </label>
            <Textarea
              id="prayer-text"
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
              placeholder={t("form.placeholder")}
              className="min-h-[120px] resize-none text-lg font-normal leading-relaxed"
              maxLength={MAX_CHARS}
              aria-describedby="char-count"
            />
            <span
              id="char-count"
              aria-live="polite"
              className={`absolute bottom-2 right-3 font-mono text-xs tracking-[0.1em] ${
                charsLeft < 30 ? "text-destructive" : "text-subtle"
              }`}
            >
              {charsLeft}
            </span>
          </div>

          {/* Name field + anonymous toggle */}
          <fieldset className="space-y-3">
            <div>
              <label
                htmlFor="prayer-name"
                className="font-mono text-xs tracking-[0.1em] uppercase text-subtle mb-2 block"
              >
                {t("form.name_label")}
              </label>
              <input
                id="prayer-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 30))}
                placeholder={t("form.name_placeholder")}
                maxLength={30}
                disabled={isAnonymous}
                aria-disabled={isAnonymous}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-lg font-normal text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
                aria-describedby="anonymous-hint"
              />
              <span className="text-base text-muted-foreground">
                {t("form.anonymous_toggle")}
              </span>
            </label>
          </fieldset>

          {/* Category selector */}
          <fieldset>
            <legend className="font-mono text-xs tracking-[0.1em] uppercase text-subtle mb-3">
              {t("form.category")}
            </legend>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("form.category")}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="radio"
                  aria-checked={category === cat}
                  onClick={() => setCategory(cat)}
                  className={`font-mono text-xs tracking-[0.1em] uppercase px-3 py-2 rounded-lg border transition-all duration-300 min-h-[36px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                    category === cat
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border text-subtle hover:text-muted-foreground hover:border-muted-foreground/30"
                  }`}
                >
                  {t(`categories.${cat}`)}
                </button>
              ))}
            </div>
          </fieldset>

          <Button
            type="submit"
            size="lg"
            className="w-full gap-2 text-lg font-semibold py-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(var(--glow-color),0.3)]"
            disabled={!text.trim() || isSubmitting}
          >
            <Send className="h-3.5 w-3.5" />
            {t("form.submit")}
          </Button>
        </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
