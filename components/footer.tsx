"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/50 mt-auto">
      <div className="max-w-[1440px] mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground text-center sm:text-left">
          {t("tagline")}
        </p>
        <nav className="flex items-center gap-5">
          <Link
            href="/privacy"
            className="font-mono text-xs tracking-[0.1em] uppercase text-subtle hover:text-foreground transition-colors duration-300"
          >
            {t("privacy")}
          </Link>
          <Link
            href="/terms"
            className="font-mono text-xs tracking-[0.1em] uppercase text-subtle hover:text-foreground transition-colors duration-300"
          >
            {t("terms")}
          </Link>
          <a
            href="https://github.com/herald-oss/praywall"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs tracking-[0.1em] uppercase text-subtle hover:text-foreground transition-colors duration-300"
          >
            {t("source")}
          </a>
        </nav>
      </div>
      <div className="max-w-[1440px] mx-auto px-6 pb-6">
        <p className="text-xs text-subtle text-center sm:text-left">
          {t("copyright", { year })}
        </p>
      </div>
    </footer>
  );
}
