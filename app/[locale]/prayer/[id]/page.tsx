import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { prayers, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PrayerCard } from "@/components/prayer-card";

export default async function PrayerDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const results = await db
    .select({
      id: prayers.id,
      text: prayers.text,
      displayName: prayers.displayName,
      userId: prayers.userId,
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
    .where(eq(prayers.id, id))
    .limit(1);

  if (results.length === 0) {
    notFound();
  }

  const prayer = results[0];

  return (
    <main className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 min-h-[44px] font-mono text-xs tracking-[0.1em] uppercase text-subtle hover:text-foreground transition-colors duration-300 mb-8"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {locale === "es" ? "Volver" : "Back"}
      </Link>

      <h1 className="text-3xl font-bold tracking-[-0.04em] mb-8">
        {locale === "es" ? "Petición de oración" : "Prayer request"}
      </h1>

      <PrayerCard prayer={prayer} />
    </main>
  );
}
