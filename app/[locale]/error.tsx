"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("error_page");
  return (
    <main className="flex-1 flex flex-col items-center justify-center text-center max-w-lg mx-auto w-full px-6 py-16 space-y-4">
      <h1 className="text-3xl font-bold tracking-[-0.04em]">{t("title")}</h1>
      <p className="text-muted-foreground">{t("message")}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" onClick={() => reset()}>
          {t("retry")}
        </Button>
        <Link href="/" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
          {t("home")}
        </Link>
      </div>
    </main>
  );
}
