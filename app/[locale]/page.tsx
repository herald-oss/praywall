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
      <section className="text-center py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-primary/10 p-4 shadow-[0_0_40px_rgba(194,119,74,0.25)]">
              <Flame className="h-10 w-10 text-primary" />
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            {t("wall.title")}
          </h1>

          <blockquote className="mb-4">
            <p className="text-lg sm:text-xl text-foreground/80 italic leading-relaxed">
              &ldquo;{t("hero.verse")}&rdquo;
            </p>
            <cite className="text-sm text-muted-foreground not-italic">
              — {t("hero.reference")}
            </cite>
          </blockquote>

          <p className="text-muted-foreground text-base mb-8">
            {t("hero.tagline")}
          </p>

          <Link
            href="/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            {t("wall.new_prayer")}
          </Link>
        </div>
      </section>

      {/* Separator */}
      <div className="max-w-[1440px] mx-auto w-full px-6">
        <div className="h-px bg-border mb-8" />
      </div>

      {/* Wall */}
      <section className="max-w-[1440px] mx-auto w-full px-6 pb-12">
        <PrayerWall />
      </section>
    </main>
  );
}
