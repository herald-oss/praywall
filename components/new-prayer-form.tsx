"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Send } from "lucide-react";
import toast from "react-hot-toast";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { DISPLAY_NAME_MAX_CHARS, PRAYER_CATEGORIES, PRAYER_MAX_CHARS } from "@/lib/constants";
import { errorMessageKey, readErrorCode } from "@/lib/errors";
import type { PublicPrayer } from "@/lib/prayers/serialize";

// Prayer-specific wording for the common codes; everything else falls back
// to the shared translated error messages.
const FORM_ERROR_KEYS: Record<string, string> = {
  inappropriate_content: "form.error_inappropriate",
  spam: "form.error_spam",
  rate_limit: "form.error_rate_limit",
  too_long: "form.error_too_long",
};

export function NewPrayerForm({ onSuccess }: { onSuccess?: (prayer: PublicPrayer) => void }) {
  const t = useTranslations();
  const { user, isLoggedIn } = useAuth();
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  // Privacy first: anonymous unless the person chooses to show a name.
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [category, setCategory] = useState<string>("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Synchronous guard against a fast double tap (state updates are async).
  const isSubmittingRef = useRef(false);
  // Stable per-attempt id so a duplicate request (double submit, retry)
  // is deduped by the server instead of creating a second prayer row.
  const clientRequestIdRef = useRef<string | null>(null);

  const charsLeft = PRAYER_MAX_CHARS - text.length;
  const showsAccountName = isLoggedIn && !!user;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    clientRequestIdRef.current ??= crypto.randomUUID();

    try {
      const res = await fetch("/api/prayers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          // Logged-in users always post under their account name (the
          // server enforces it); the field is only sent for guests.
          name: isAnonymous || showsAccountName ? null : name.trim() || null,
          isAnonymous,
          category,
          clientRequestId: clientRequestIdRef.current,
        }),
      });

      if (res.ok) {
        const created = (await res.json()) as PublicPrayer;
        clientRequestIdRef.current = null;
        setText("");
        setName("");
        setIsAnonymous(true);
        setCategory("general");
        onSuccess?.(created);
      } else {
        const code = await readErrorCode(res);
        toast.error(t(FORM_ERROR_KEYS[code] ?? errorMessageKey(code)));
      }
    } catch {
      toast.error(t("errors.network"));
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Prayer text */}
      <div className="relative">
        <label htmlFor="prayer-text" className="sr-only">
          {t("form.placeholder")}
        </label>
        <Textarea
          id="prayer-text"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, PRAYER_MAX_CHARS))}
          placeholder={t("form.placeholder")}
          className="min-h-[180px] resize-none text-lg font-normal leading-relaxed"
          maxLength={PRAYER_MAX_CHARS}
          aria-describedby="char-count"
        />
        <span
          id="char-count"
          aria-live="polite"
          className={`absolute bottom-2 right-3 font-mono text-xs tracking-[0.1em] ${
            charsLeft < 30 ? "text-destructive" : "text-subtle"
          }`}
        >
          <span aria-hidden>{charsLeft}</span>
          <span className="sr-only">{t("form.chars_left", { count: charsLeft })}</span>
        </span>
      </div>

      {/* Anonymous toggle + optional name */}
      <fieldset className="space-y-3">
        <label className="flex items-center gap-2.5 cursor-pointer min-h-[44px]">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <span className="text-base text-muted-foreground">{t("form.anonymous_toggle")}</span>
        </label>
        {!isAnonymous && (
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
              value={showsAccountName ? user.name : name}
              onChange={(e) => setName(e.target.value.slice(0, DISPLAY_NAME_MAX_CHARS))}
              placeholder={t("form.name_placeholder")}
              maxLength={DISPLAY_NAME_MAX_CHARS}
              readOnly={showsAccountName}
              aria-readonly={showsAccountName}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-lg font-normal text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300 read-only:opacity-70"
            />
          </div>
        )}
      </fieldset>

      {/* Category — native radios: arrow keys and screen readers work for free */}
      <fieldset>
        <legend className="font-mono text-xs tracking-[0.1em] uppercase text-subtle mb-3">
          {t("form.category")}
        </legend>
        <div className="flex flex-wrap gap-2">
          {PRAYER_CATEGORIES.map((cat) => (
            <label
              key={cat}
              className={`cursor-pointer font-mono text-xs tracking-[0.1em] uppercase px-3 py-2 rounded-lg border transition-all duration-300 min-h-[44px] inline-flex items-center has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring ${
                category === cat
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-subtle hover:text-muted-foreground hover:border-muted-foreground/30"
              }`}
            >
              <input
                type="radio"
                name="category"
                value={cat}
                checked={category === cat}
                onChange={() => setCategory(cat)}
                className="sr-only"
              />
              {t(`categories.${cat}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <Button
        type="submit"
        size="lg"
        className="w-full gap-2 text-lg font-semibold py-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(var(--glow-color),0.3)]"
        disabled={!text.trim() || isSubmitting}
      >
        <Send className="h-4 w-4" aria-hidden />
        {t("form.submit")}
      </Button>
    </form>
  );
}
