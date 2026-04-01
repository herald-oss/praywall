"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/user-nav";

export function Navbar() {
  const t = useTranslations();

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="max-w-[1440px] mx-auto px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="font-mono text-sm tracking-[0.1em] uppercase text-foreground hover:text-primary transition-colors duration-300"
        >
          {t("common.app_name")}
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <UserNav />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
