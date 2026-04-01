"use client";

import { useTranslations } from "next-intl";
import { NewPrayerForm } from "@/components/new-prayer-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

export function NewPrayerPageContent() {
  const t = useTranslations();
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);

  function handleContinue() {
    if (isLoggedIn) {
      router.push("/");
    } else {
      router.push("/register");
    }
  }

  return (
    <main className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-10">
      {showSuccess ? (
        /* ── Success state ── */
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
          <div className="rounded-full bg-primary/10 p-6">
            <Heart className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-[-0.04em]">
            {t("success.title")}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {t("success.message")}
          </p>
          <Button
            size="lg"
            className="gap-2 text-lg font-semibold py-4 px-8 transition-all duration-300 hover:shadow-[0_0_20px_rgba(var(--glow-color),0.3)]"
            onClick={handleContinue}
          >
            {t("success.continue")}
          </Button>
        </div>
      ) : (
        /* ── Form state ── */
        <>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 min-h-[44px] font-mono text-xs tracking-[0.1em] uppercase text-subtle hover:text-foreground transition-colors duration-300 mb-8"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("common.back")}
          </Link>

          <h1 className="text-3xl font-bold tracking-[-0.04em] mb-8">
            {t("wall.new_prayer")}
          </h1>

          <NewPrayerForm onSuccess={() => setShowSuccess(true)} />
        </>
      )}
    </main>
  );
}
