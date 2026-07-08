"use client";

import { useTranslations, useLocale } from "next-intl";

// Fixed publish date — update this when the copy actually changes, not on
// every page load.
const LAST_UPDATED_ISO = "2026-07-08";

const SECTION_KEYS: Record<"privacy" | "terms", string[]> = {
  privacy: [
    "collect",
    "why",
    "moderation",
    "sharing",
    "deletion",
    "rights",
    "cookies",
    "security",
    "changes",
    "contact",
  ],
  terms: [
    "service",
    "conduct",
    "content",
    "noWarranty",
    "accounts",
    "openSource",
    "changes",
  ],
};

export function LegalPageContent({
  namespace,
}: {
  namespace: "privacy" | "terms";
}) {
  const t = useTranslations(namespace);
  const locale = useLocale();
  const updated = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
    new Date(LAST_UPDATED_ISO)
  );

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
      <h1 className="text-3xl font-bold tracking-[-0.04em] mb-2">
        {t("title")}
      </h1>
      <p className="font-mono text-xs tracking-[0.1em] uppercase text-subtle mb-8">
        {t("updated", { date: updated })}
      </p>
      <p className="text-base text-foreground/80 leading-relaxed mb-10">
        {t("intro")}
      </p>
      <div className="space-y-8">
        {SECTION_KEYS[namespace].map((key) => (
          <section key={key}>
            <h2 className="font-mono text-xs tracking-[0.1em] uppercase text-subtle mb-2">
              {t(`${key}_title`)}
            </h2>
            <p className="text-base text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {t(`${key}_body`)}
            </p>
          </section>
        ))}
      </div>
    </main>
  );
}
