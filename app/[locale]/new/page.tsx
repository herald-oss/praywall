import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { NewPrayerPageContent } from "@/components/new-prayer-page-content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "wall" });
  return { title: t("new_prayer") };
}

export default async function NewPrayerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <NewPrayerPageContent />;
}
