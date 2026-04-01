import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { PrayerWall } from "@/components/prayer-wall";
import { Flame } from "lucide-react";
import Link from "next/link";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations();

  return (
    <main className="flex-1 flex flex-col">
      {/* Hero */}
      <section className="text-center py-10 px-6">
        <div className="max-w-xl mx-auto">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3 shadow-[0_0_32px_rgba(194,119,74,0.25)]">
              <Flame className="h-7 w-7 text-primary" />
            </div>
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {t("wall.title")}
          </h1>

          <p className="text-base text-foreground/70 italic mb-1">
            &ldquo;{t("hero.verse")}&rdquo;
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            — {t("hero.reference")}
          </p>

          <p className="text-sm text-muted-foreground mb-5">
            {t("hero.tagline")}
          </p>

          <Link
            href="/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            {t("wall.new_prayer")}
          </Link>
        </div>
      </section>

      {/* Separator */}
      <div className="max-w-[1440px] mx-auto w-full px-6">
        <div className="h-px bg-border mb-6" />
      </div>

      {/* Wall */}
      <section className="max-w-[1440px] mx-auto w-full px-6 pb-12">
        <PrayerWall />
      </section>
    </main>
  );
}
