"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { AuthDialog } from "@/components/auth-dialog";
import { useState } from "react";
import { LogOut } from "lucide-react";
import Link from "next/link";

export function UserNav() {
  const t = useTranslations();
  const { user, isLoggedIn, isLoading, signOut } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  if (isLoading) return null;

  if (isLoggedIn && user) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-mono font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-mono text-xs tracking-[0.1em] text-subtle hidden sm:inline">
            @{user.username}
          </span>
        </div>
        <button
          onClick={() => signOut()}
          className="h-10 w-10 rounded-lg border border-border flex items-center justify-center text-subtle hover:text-foreground hover:border-muted-foreground/30 transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          aria-label={t("auth.sign_out")}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setAuthOpen(true)}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-300"
        >
          {t("auth.sign_in")}
        </button>
        <Link
          href="/register"
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors duration-300"
        >
          {t("auth.create_account")}
        </Link>
      </div>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
