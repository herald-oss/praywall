"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountProfile } from "@/components/account-profile";
import { PrayerCard } from "@/components/prayer-card";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "@/i18n/navigation";
import type { PublicPrayer } from "@/lib/prayers/serialize";

function PrayerListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="h-24 rounded-lg bg-card animate-pulse border border-border" />
      ))}
    </div>
  );
}

function PrayerList({
  loading,
  prayers,
  empty,
  onDeleted,
  onAnswered,
  allowTestimony = false,
}: {
  loading: boolean;
  prayers: PublicPrayer[];
  empty: string;
  onDeleted: (id: string) => void;
  onAnswered?: (updated: PublicPrayer) => void;
  allowTestimony?: boolean;
}) {
  if (loading) return <PrayerListSkeleton />;
  if (prayers.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="space-y-3">
      {prayers.map((prayer) => (
        <PrayerCard
          key={prayer.id}
          prayer={prayer}
          onDeleted={onDeleted}
          onAnswered={onAnswered}
          allowTestimony={allowTestimony}
        />
      ))}
    </div>
  );
}

export function AccountPageContent() {
  const t = useTranslations();
  const { user, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const [myPrayers, setMyPrayers] = useState<PublicPrayer[]>([]);
  const [intercededPrayers, setIntercededPrayers] = useState<PublicPrayer[]>([]);
  const [prayersLoading, setPrayersLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) router.replace("/");
  }, [isLoggedIn, isLoading, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch("/api/account/prayers")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setMyPrayers(data.myPrayers);
          setIntercededPrayers(data.intercededPrayers);
        }
      })
      .catch(() => {})
      .finally(() => setPrayersLoading(false));
  }, [isLoggedIn]);

  const handleDeleted = useCallback((id: string) => {
    setMyPrayers((prev) => prev.filter((p) => p.id !== id));
    setIntercededPrayers((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleAnswered = useCallback((updated: PublicPrayer) => {
    setMyPrayers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  const answeredPrayers = useMemo(() => myPrayers.filter((p) => p.answeredAt != null), [myPrayers]);

  if (isLoading || !isLoggedIn || !user) return null;

  return (
    <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-6 py-10">
      <h1 className="text-3xl font-bold tracking-[-0.04em] mb-2">{t("account.title")}</h1>
      <p className="text-muted-foreground text-base mb-8">@{user.username}</p>

      <Tabs defaultValue="requests">
        <TabsList className="mb-6 w-full">
          <TabsTrigger value="requests">{t("account.tab_requests")}</TabsTrigger>
          <TabsTrigger value="prayed">{t("account.tab_prayed")}</TabsTrigger>
          <TabsTrigger value="answered">{t("account.tab_answered")}</TabsTrigger>
          <TabsTrigger value="profile">{t("account.tab_info")}</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <PrayerList
            loading={prayersLoading}
            prayers={myPrayers}
            empty={t("account.my_prayers_empty")}
            onDeleted={handleDeleted}
            onAnswered={handleAnswered}
            allowTestimony
          />
        </TabsContent>

        <TabsContent value="prayed">
          <PrayerList
            loading={prayersLoading}
            prayers={intercededPrayers}
            empty={t("account.interceded_empty")}
            onDeleted={handleDeleted}
          />
        </TabsContent>

        <TabsContent value="answered">
          <PrayerList
            loading={prayersLoading}
            prayers={answeredPrayers}
            empty={t("account.answered_empty")}
            onDeleted={handleDeleted}
            onAnswered={handleAnswered}
            allowTestimony
          />
        </TabsContent>

        <TabsContent value="profile">
          <AccountProfile />
        </TabsContent>
      </Tabs>
    </main>
  );
}
