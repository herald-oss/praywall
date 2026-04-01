"use client";

import { useTranslations } from "next-intl";

export function IntercessorCount({ count }: { count: number }) {
  const t = useTranslations("wall");

  if (count === 0) return null;

  function getWarmState(): string {
    if (count === 1) return t("someone_praying");
    if (count <= 5) return t("some_praying");
    return t("many_praying");
  }

  return (
    <span className="font-mono text-sm tracking-[0.1em] text-muted-foreground italic">
      {getWarmState()}
    </span>
  );
}
