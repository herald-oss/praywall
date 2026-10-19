"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { BookOpen, Heart, Share2, Users } from "lucide-react";
import { RegisterForm } from "@/components/register-form";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "@/i18n/navigation";
import { dismissInvite } from "@/lib/invite";

export function RegisterPageContent() {
  const t = useTranslations();
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"register" | "login">("register");

  useEffect(() => {
    if (!isLoading && isLoggedIn) router.replace("/");
  }, [isLoggedIn, isLoading, router]);

  if (isLoading || isLoggedIn) return null;

  // Only things the app actually does.
  const benefits = [
    { icon: Heart, text: t("auth.benefit_answered") },
    { icon: BookOpen, text: t("auth.benefit_history") },
    { icon: Users, text: t("auth.benefit_count") },
    { icon: Share2, text: t("auth.benefit_share") },
  ];

  return (
    <main className="flex-1 flex flex-col max-w-md mx-auto w-full px-6 py-10">
      <h1 className="text-3xl font-bold tracking-[-0.04em] mb-2">{t("register_page.title")}</h1>
      <p className="text-muted-foreground text-base mb-8">{t("register_page.subtitle")}</p>

      <ul className="space-y-3 mb-8">
        {benefits.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-3">
            <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
            <span className="text-base text-foreground/80">{text}</span>
          </li>
        ))}
      </ul>

      <RegisterForm mode={mode} onModeChange={setMode} onSuccess={() => router.push("/")} />

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={() => {
            dismissInvite();
            router.push("/");
          }}
          className="min-h-[44px] px-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
        >
          {t("register_page.no_thanks")}
        </button>
      </div>
    </main>
  );
}
