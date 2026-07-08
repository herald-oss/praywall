"use client";

import { useTranslations } from "next-intl";
import { RegisterForm } from "@/components/register-form";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, BookOpen, Bell, Share2 } from "lucide-react";
import Link from "next/link";

function setSkipCookie() {
  document.cookie =
    "praywall_skip_register=1; path=/; max-age=31536000; samesite=lax";
}

export function RegisterPageContent() {
  const t = useTranslations();
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"register" | "login">("register");

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.replace("/");
    }
  }, [isLoggedIn, isLoading, router]);

  if (isLoading || isLoggedIn) return null;

  const benefits = [
    { icon: Heart, text: t("auth.benefit_answered") },
    { icon: BookOpen, text: t("auth.benefit_history") },
    { icon: Bell, text: t("auth.benefit_notifications") },
    { icon: Share2, text: t("auth.benefit_share") },
  ];

  return (
    <main className="flex-1 flex flex-col max-w-md mx-auto w-full px-6 py-10">
      <h1 className="text-3xl font-bold tracking-[-0.04em] mb-2">
        {t("register_page.title")}
      </h1>
      <p className="text-muted-foreground text-base mb-8">
        {t("register_page.subtitle")}
      </p>

      {/* Benefits */}
      <div className="space-y-3 mb-8">
        {benefits.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-start gap-3">
            <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <span className="text-base text-foreground/80">{text}</span>
          </div>
        ))}
      </div>

      {/* Register form */}
      <RegisterForm
        mode={mode}
        onModeChange={setMode}
        onSuccess={() => router.push("/")}
      />

      {/* No thanks */}
      <div className="mt-6 flex flex-col items-center gap-3">
        <button
          onClick={() => {
            setSkipCookie();
            router.push("/");
          }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
        >
          {t("register_page.no_thanks")}
        </button>
        <Link
          href="/"
          className="text-sm text-subtle hover:text-muted-foreground transition-colors duration-300"
        >
          {t("register_page.back_home")}
        </Link>
      </div>
    </main>
  );
}
