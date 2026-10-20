"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LABELS: Record<string, { short: string; name: string }> = {
  es: { short: "ES", name: "Español" },
  en: { short: "EN", name: "English" },
};

/** Switches language while staying on the same page. */
export function LocaleSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div role="group" aria-label={t("language")} className="flex items-center">
      {routing.locales.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            lang={l}
            disabled={active || isPending}
            aria-pressed={active}
            aria-label={active ? LABELS[l].name : t("switch_language", { language: LABELS[l].name })}
            onClick={() => startTransition(() => router.replace(pathname, { locale: l }))}
            className={`h-10 min-w-10 px-2 rounded-lg font-mono text-xs tracking-[0.1em] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
              active ? "text-foreground" : "text-subtle hover:text-foreground"
            }`}
          >
            {LABELS[l].short}
          </button>
        );
      })}
    </div>
  );
}
