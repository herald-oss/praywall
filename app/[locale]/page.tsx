import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { PrayerWall } from "@/components/prayer-wall";
import { PrayerCard } from "@/components/prayer-card";
import { Flame } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { prayers, user } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

type FeaturedPrayer = {
  id: string;
  text: string;
  displayName: string | null;
  userId: string | null;
  visitorId: string | null;
  isAnonymous: boolean | null;
  category: string | null;
  intercessorCount: number | null;
  goalReached: boolean | null;
  answeredAt: Date | null;
  createdAt: Date;
  userName: string | null;
};

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const candidates = await db
    .select({
      id: prayers.id,
      text: prayers.text,
      displayName: prayers.displayName,
      userId: prayers.userId,
      visitorId: prayers.visitorId,
      isAnonymous: prayers.isAnonymous,
      category: prayers.category,
      intercessorCount: prayers.intercessorCount,
      goalReached: prayers.goalReached,
      answeredAt: prayers.answeredAt,
      createdAt: prayers.createdAt,
      userName: user.name,
    })
    .from(prayers)
    .leftJoin(user, eq(prayers.userId, user.id))
    .where(eq(prayers.intercessorCount, 0))
    .orderBy(asc(prayers.createdAt))
    .limit(5);

  const featured: FeaturedPrayer | null =
    candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : null;

  return <HomeContent featured={featured} />;
}

function HomeContent({ featured }: { featured: FeaturedPrayer | null }) {
  const t = useTranslations();

  return (
    <main className="flex-1 flex flex-col max-w-[1440px] mx-auto w-full px-6">
      {/* Hero — Editorial Cyberfaith */}
      <section className="pt-12 pb-10 sm:pt-16 sm:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left — Explanation */}
          <div>
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

            {/* Description */}
            <p className="text-foreground/80 font-normal text-base sm:text-lg leading-relaxed mb-6">
              {t("hero.description")}
            </p>

            {/* Verse */}
            <blockquote className="border-l-2 border-primary/40 pl-4 mb-6">
              <p className="text-base sm:text-lg text-foreground/70 italic font-light leading-relaxed">
                &ldquo;{t("hero.verse")}&rdquo;
              </p>
              <cite className="font-mono text-xs tracking-[0.1em] text-subtle not-italic mt-1 block">
                {t("hero.reference")}
              </cite>
            </blockquote>

            {/* CTA */}
            <Link
              href="/new"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-mono text-xs tracking-[0.1em] uppercase font-medium text-primary-foreground transition-all duration-300 hover:bg-primary/80 hover:shadow-[0_0_20px_rgba(var(--glow-color),0.3)]"
            >
              {t("wall.new_prayer")}
            </Link>
          </div>

          {/* Right — Featured prayer */}
          {featured && (
            <div className="lg:pt-12">
              <p className="font-mono text-xs tracking-[0.1em] uppercase text-subtle mb-4">
                {t("hero.featured_title")}
              </p>
              <PrayerCard prayer={featured} />
            </div>
          )}
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
