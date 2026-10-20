"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { dismissInvite } from "@/lib/invite";

/**
 * A gentle, optional invitation to create an account. Never blocks or
 * redirects — "Not now" just hides it for a while.
 */
export function SoftInvite({ onDone }: { onDone?: () => void }) {
  const t = useTranslations("invite");
  return (
    <div className="w-full rounded-lg border border-primary/20 bg-primary/5 p-4 text-left space-y-3">
      <p className="font-semibold text-foreground">{t("title")}</p>
      <p className="text-sm text-muted-foreground leading-relaxed">{t("message")}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/register"
          onClick={onDone}
          className="inline-flex items-center justify-center min-h-[44px] rounded-lg bg-primary px-4 font-mono text-xs tracking-[0.1em] uppercase font-medium text-primary-foreground transition-colors duration-300 hover:bg-primary/80"
        >
          {t("create")}
        </Link>
        <button
          type="button"
          onClick={() => {
            dismissInvite();
            onDone?.();
          }}
          className="min-h-[44px] px-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
        >
          {t("later")}
        </button>
      </div>
    </div>
  );
}
