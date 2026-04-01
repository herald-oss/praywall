import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { prayers, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ArrowLeft, Flame } from "lucide-react";
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
    <main className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-8">
      <Link
        href="/"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {locale === "es" ? "Volver" : "Back"}
      </Link>

      <div className="flex items-center gap-2 mb-6">
        <Flame className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold">
          {locale === "es" ? "Petición de oración" : "Prayer request"}
        </h1>
      </div>

      <PrayerCard prayer={prayer} />
    </main>
  );
}
