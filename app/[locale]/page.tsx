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
      {/* Hero — Editorial Cyberfaith */}
      <section className="px-6 pt-12 pb-10 sm:pt-16 sm:pb-12">
        <div className="max-w-[1440px] mx-auto">
          <div className="max-w-2xl">
            {/* Logo mark */}
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-full bg-primary/10 p-2 shadow-[0_0_24px_rgba(var(--glow-color),0.2)]">
                <Flame className="h-5 w-5 text-primary" />
              </div>
              <span className="font-mono text-xs tracking-[0.1em] uppercase text-subtle">
                {t("common.app_name")}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.04em] leading-[1.1] mb-6">
              {t("wall.title")}
            </h1>

            {/* Verse */}
            <blockquote className="border-l-2 border-primary/40 pl-4 mb-6">
              <p className="text-base sm:text-lg text-foreground/70 italic font-light leading-relaxed">
                &ldquo;{t("hero.verse")}&rdquo;
              </p>
              <cite className="font-mono text-xs tracking-[0.1em] text-subtle not-italic mt-1 block">
                {t("hero.reference")}
              </cite>
            </blockquote>

            {/* Tagline */}
            <p className="text-muted-foreground font-normal text-base mb-8">
              {t("hero.tagline")}
            </p>

            {/* CTA */}
            <Link
              href="/new"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-mono text-xs tracking-[0.1em] uppercase font-medium text-primary-foreground transition-all duration-300 hover:bg-primary/80 hover:shadow-[0_0_20px_rgba(var(--glow-color),0.3)]"
            >
              {t("wall.new_prayer")}
            </Link>
          </div>
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
