"use client";

import { useTranslations } from "next-intl";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
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

export function NewPrayerForm() {
  const t = useTranslations();
  const router = useRouter();
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [category, setCategory] = useState<string>("general");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const charsLeft = MAX_CHARS - text.length;

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
        router.push("/");
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
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Prayer text */}
          <div className="relative">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
              placeholder={t("form.placeholder")}
              className="min-h-[120px] resize-none text-base"
              maxLength={MAX_CHARS}
            />
            <span
              className={`absolute bottom-2 right-2 text-xs ${
                charsLeft < 30
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {t("form.chars_left", { count: charsLeft })}
            </span>
          </div>

          {/* Anonymous toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded border-border accent-primary"
            />
            <span className="text-sm text-muted-foreground">
              {t("form.anonymous_toggle")}
            </span>
          </label>

          {/* Name field — only when not anonymous */}
          {!isAnonymous && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                {t("form.name_label")}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 30))}
                placeholder={t("form.name_placeholder")}
                maxLength={30}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          {/* Category selector — secondary, collapsible feel */}
          <details className="group">
            <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors list-none flex items-center gap-1">
              <span className="text-xs group-open:rotate-90 transition-transform">&#9654;</span>
              {t("form.category")}
              {category !== "general" && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {t(`categories.${category}`)}
                </Badge>
              )}
            </summary>
            <div className="flex flex-wrap gap-2 mt-2">
              {CATEGORIES.map((cat) => (
                <Badge
                  key={cat}
                  variant={category === cat ? "default" : "secondary"}
                  className="cursor-pointer transition-colors"
                  onClick={() => setCategory(cat)}
                >
                  {t(`categories.${cat}`)}
                </Badge>
              ))}
            </div>
          </details>

          <Button
            type="submit"
            size="lg"
            className="w-full gap-2"
            disabled={!text.trim() || isSubmitting}
          >
            <Send className="h-4 w-4" />
            {t("form.submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
