"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { AuthDialog } from "@/components/auth-dialog";
import { useState } from "react";
import { LogIn, LogOut } from "lucide-react";

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
      <button
        onClick={() => setAuthOpen(true)}
        className="h-10 w-10 rounded-lg border border-border flex items-center justify-center text-subtle hover:text-foreground hover:border-muted-foreground/30 transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        aria-label={t("auth.sign_in")}
      >
        <LogIn className="h-4 w-4" />
      </button>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
