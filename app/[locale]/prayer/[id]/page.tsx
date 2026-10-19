export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PrayerDetail } from "@/components/prayer-detail";
import { LivePrayersProvider } from "@/components/live-prayers";
import { getVisiblePrayer } from "@/lib/prayers/queries";
import { toPublicPrayer } from "@/lib/prayers/serialize";
import { getRequester } from "@/lib/requester";
import { isUuid } from "@/lib/validation";

// Prayer requests are personal: never index individual prayer pages.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "prayer_page" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function PrayerDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // Malformed ids are a plain 404, not a database error.
  if (!isUuid(id)) notFound();

  const requester = await getRequester(await cookies());
  const row = await getVisiblePrayer(id, requester);
  if (!row) notFound();

  const prayer = toPublicPrayer(row, requester);
  const t = await getTranslations();

  return (
    <main className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 min-h-[44px] font-mono text-xs tracking-[0.1em] uppercase text-subtle hover:text-foreground transition-colors duration-300 mb-8"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("common.back")}
      </Link>

      <h1 className="text-3xl font-bold tracking-[-0.04em] mb-8">
        {t("prayer_page.title")}
      </h1>

      <LivePrayersProvider watchIds={[prayer.id]}>
        <PrayerDetail prayer={prayer} />
      </LivePrayersProvider>
    </main>
  );
}
