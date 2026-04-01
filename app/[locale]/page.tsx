import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { PrayerWall } from "@/components/prayer-wall";
import { NewPrayerDialog } from "@/components/new-prayer-dialog";
import { Flame } from "lucide-react";

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
    <main className="flex-1 flex flex-col max-w-[1440px] mx-auto w-full px-6">
      {/* Hero — Editorial Cyberfaith */}
      <section className="pt-12 pb-10 sm:pt-16 sm:pb-12">
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
          <NewPrayerDialog>
            {t("wall.new_prayer")}
          </NewPrayerDialog>
        </div>
      </section>

      {/* Separator */}
      <div className="h-px bg-border mb-8" />

      {/* Wall */}
      <section className="pb-12">
        <PrayerWall />
      </section>
    </main>
  );
}
