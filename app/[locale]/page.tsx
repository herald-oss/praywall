export const dynamic = "force-dynamic";

import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { PrayerWall } from "@/components/prayer-wall";
import { PrayerCard } from "@/components/prayer-card";
import { LivePrayersProvider } from "@/components/live-prayers";
import { Link } from "@/i18n/navigation";
import { cookies } from "next/headers";
import { pickFeaturedPrayer } from "@/lib/prayers/queries";
import { toPublicPrayer, type PublicPrayer } from "@/lib/prayers/serialize";
import { getRequester } from "@/lib/requester";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const featured = await loadFeaturedPrayer();

  return <HomeContent featured={featured} />;
}

// Kept outside the component so the random pick isn't an impure call
// during render.
async function loadFeaturedPrayer(): Promise<PublicPrayer | null> {
  const requester = await getRequester(await cookies());
  const pick = await pickFeaturedPrayer(requester);
  return pick ? toPublicPrayer(pick, requester) : null;
}

function HomeContent({ featured }: { featured: PublicPrayer | null }) {
  const t = useTranslations();

  return (
    <LivePrayersProvider watchIds={featured ? [featured.id] : []}>
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
        {/* The featured prayer is already shown above — don't repeat it. */}
        <PrayerWall excludeId={featured?.id ?? null} />
      </section>
    </main>
    </LivePrayersProvider>
  );
}
