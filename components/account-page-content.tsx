"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

export function AccountPageContent() {
  const t = useTranslations();
  const { user, isLoggedIn, isLoading, deleteAccount } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace("/");
    }
  }, [isLoggedIn, isLoading, router]);

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
    <main className="flex-1 flex flex-col max-w-md mx-auto w-full px-6 py-10">
      <h1 className="text-3xl font-bold tracking-[-0.04em] mb-2">
        {t("account.title")}
      </h1>
      <p className="text-muted-foreground text-base mb-8">
        @{user.username}
      </p>

      <div className="rounded-lg border border-destructive/30 p-5 space-y-4">
        <div>
          <h2 className="font-mono text-xs tracking-[0.1em] uppercase text-destructive mb-1">
            {t("account.delete_title")}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("account.delete_description")}
          </p>
        </div>

        {!confirming ? (
          <Button
            type="button"
            variant="destructive"
            onClick={() => setConfirming(true)}
          >
            {t("account.delete_cta")}
          </Button>
        ) : (
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
            <div className="flex gap-2">
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
                  setConfirming(false);
                  setPassword("");
                }}
              >
                {t("account.cancel")}
              </Button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
