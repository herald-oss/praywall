import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { PrayerWall } from "@/components/prayer-wall";
import { PrayerCard } from "@/components/prayer-card";
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
      {/* Hero — 70vh, split on desktop, stacked on mobile */}
      <section className="min-h-[70vh] flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left — Text */}
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.04em] leading-[1.1]">
              {t("wall.title")}
            </h1>

            <p className="text-foreground/80 font-normal text-base sm:text-lg leading-relaxed">
              {t("hero.description")}
            </p>

            <blockquote className="border-l-2 border-primary/40 pl-4">
              <p className="text-base text-foreground/60 italic leading-relaxed">
                &ldquo;{t("hero.verse")}&rdquo;
              </p>
              <cite className="font-mono text-xs tracking-[0.1em] text-subtle not-italic mt-1 block">
                {t("hero.reference")}
              </cite>
            </blockquote>

            <Link
              href="/new"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-mono text-xs tracking-[0.1em] uppercase font-medium text-primary-foreground transition-all duration-300 hover:bg-primary/80 hover:shadow-[0_0_20px_rgba(var(--glow-color),0.3)]"
            >
              {t("wall.new_prayer")}
            </Link>
          </div>

          {/* Right — Featured prayer */}
          {featured && (
            <div>
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
