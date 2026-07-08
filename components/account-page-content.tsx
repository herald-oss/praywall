"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PrayerCard } from "@/components/prayer-card";
import type { PublicPrayer } from "@/lib/prayers/serialize";

function PrayerListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="h-24 rounded-lg bg-card animate-pulse border border-border"
        />
      ))}
    </div>
  );
}

export function AccountPageContent() {
  const t = useTranslations();
  const { user, isLoggedIn, isLoading, deleteAccount } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [myPrayers, setMyPrayers] = useState<PublicPrayer[]>([]);
  const [intercededPrayers, setIntercededPrayers] = useState<PublicPrayer[]>([]);
  const [prayersLoading, setPrayersLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace("/");
    }
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
      .finally(() => setPrayersLoading(false));
  }, [isLoggedIn]);

  const handleMyPrayerDeleted = useCallback((id: string) => {
    setMyPrayers((prev) => prev.filter((p) => p.id !== id));
    setIntercededPrayers((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleAnswered = useCallback((updated: PublicPrayer) => {
    setMyPrayers((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  }, []);

  const answeredPrayers = useMemo(
    () => myPrayers.filter((p) => p.answeredAt != null),
    [myPrayers]
  );

  if (isLoading || !isLoggedIn || !user) return null;

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!password || isDeleting) return;
    setIsDeleting(true);

    try {
      await deleteAccount(password);
      toast.success(t("account.delete_success"));
      router.push("/");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("account.delete_error")
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-6 py-10">
      <h1 className="text-3xl font-bold tracking-[-0.04em] mb-2">
        {t("account.title")}
      </h1>
      <p className="text-muted-foreground text-base mb-8">
        @{user.username}
      </p>

      <Tabs defaultValue="info">
        <TabsList className="mb-6 w-full">
          <TabsTrigger value="info">{t("account.tab_info")}</TabsTrigger>
          <TabsTrigger value="requests">
            {t("account.tab_requests")}
          </TabsTrigger>
          <TabsTrigger value="prayed">{t("account.tab_prayed")}</TabsTrigger>
          <TabsTrigger value="answered">
            {t("account.tab_answered")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <div className="rounded-lg border border-destructive/30 p-5 space-y-4">
            <div>
              <h2 className="font-mono text-xs tracking-[0.1em] uppercase text-destructive mb-1">
                {t("account.delete_title")}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("account.delete_description")}
              </p>
            </div>

            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
            >
              {t("account.delete_cta")}
            </Button>
          </div>

          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("account.delete_title")}</DialogTitle>
                <DialogDescription>
                  {t("account.delete_description")}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleDelete} className="space-y-3">
                <label htmlFor="delete-password" className="sr-only">
                  {t("auth.password")}
                </label>
                <input
                  id="delete-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.password")}
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <DialogFooter className="-mx-0 -mb-0 rounded-b-none border-t-0 bg-transparent p-0 sm:justify-start">
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={!password || isDeleting}
                  >
                    {t("account.delete_confirm_cta")}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setDeleteOpen(false);
                      setPassword("");
                    }}
                  >
                    {t("account.cancel")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="requests">
          {prayersLoading ? (
            <PrayerListSkeleton />
          ) : myPrayers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("account.my_prayers_empty")}
            </p>
          ) : (
            <div className="space-y-3">
              {myPrayers.map((prayer) => (
                <PrayerCard
                  key={prayer.id}
                  prayer={prayer}
                  onDeleted={handleMyPrayerDeleted}
                  onAnswered={handleAnswered}
                  allowTestimony
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="prayed">
          {prayersLoading ? (
            <PrayerListSkeleton />
          ) : intercededPrayers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("account.interceded_empty")}
            </p>
          ) : (
            <div className="space-y-3">
              {intercededPrayers.map((prayer) => (
                <PrayerCard
                  key={prayer.id}
                  prayer={prayer}
                  onDeleted={handleMyPrayerDeleted}
                  initialHasPrayed
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="answered">
          {prayersLoading ? (
            <PrayerListSkeleton />
          ) : answeredPrayers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("account.answered_empty")}
            </p>
          ) : (
            <div className="space-y-3">
              {answeredPrayers.map((prayer) => (
                <PrayerCard
                  key={prayer.id}
                  prayer={prayer}
                  onDeleted={handleMyPrayerDeleted}
                  onAnswered={handleAnswered}
                  allowTestimony
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
