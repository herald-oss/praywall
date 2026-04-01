import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { NewPrayerForm } from "@/components/new-prayer-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewPrayerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <NewPrayerContent />;
}

function NewPrayerContent() {
  const t = useTranslations();

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
        {t("wall.new_prayer")}
      </h1>

      <NewPrayerForm />
    </main>
  );
}
