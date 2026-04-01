import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { NewPrayerForm } from "@/components/new-prayer-form";
import { ArrowLeft, Flame } from "lucide-react";
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
    <main className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-8">
      <Link
        href="/"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("common.back")}
      </Link>

      <div className="flex items-center gap-2 mb-6">
        <Flame className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">{t("wall.new_prayer")}</h1>
      </div>

      <NewPrayerForm />
    </main>
  );
}
