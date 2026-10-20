"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { ArrowLeft, Heart, Share2 } from "lucide-react";
import toast from "react-hot-toast";
import { NewPrayerForm } from "@/components/new-prayer-form";
import { SoftInvite } from "@/components/soft-invite";
import { Button } from "@/components/ui/button";
import { getPathname, Link } from "@/i18n/navigation";
import { useAuth } from "@/hooks/use-auth";
import { markInviteShown, shouldShowInvite } from "@/lib/invite";
import type { PublicPrayer } from "@/lib/prayers/serialize";
import { shareLink } from "@/lib/share";

const linkButton =
  "inline-flex items-center justify-center gap-2 min-h-[44px] rounded-lg px-6 py-3 font-mono text-xs tracking-[0.1em] uppercase font-medium transition-colors duration-300";

export function NewPrayerPageContent() {
  const t = useTranslations();
  const locale = useLocale();
  const { isLoggedIn } = useAuth();
  const [created, setCreated] = useState<PublicPrayer | null>(null);
  const [withInvite, setWithInvite] = useState(false);

  function handleSuccess(prayer: PublicPrayer) {
    const invite = !isLoggedIn && shouldShowInvite();
    if (invite) markInviteShown();
    setWithInvite(invite);
    setCreated(prayer);
  }

  async function handleShare(prayer: PublicPrayer) {
    const url = `${window.location.origin}${getPathname({ href: `/prayer/${prayer.id}`, locale })}`;
    const result = await shareLink({ url, title: t("wall.share_text"), text: t("wall.share_text") });
    if (result === "copied") toast.success(t("wall.link_copied"));
    else if (result === "failed") toast.error(t("errors.generic"));
  }

  return (
    <main className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-10">
      {created ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
          <div className="rounded-full bg-primary/10 p-6">
            <Heart className="h-12 w-12 text-primary" aria-hidden />
          </div>
          <h1 className="text-3xl font-bold tracking-[-0.04em]">{t("success.title")}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">{t("success.message")}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/prayer/${created.id}`}
              className={`${linkButton} bg-primary text-primary-foreground hover:bg-primary/80`}
            >
              {t("success.view")}
            </Link>
            <Button variant="secondary" size="lg" className="min-h-[44px] gap-2" onClick={() => handleShare(created)}>
              <Share2 className="h-4 w-4" aria-hidden />
              {t("success.share")}
            </Button>
          </div>
          <Link href="/" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
            {t("success.back_wall")}
          </Link>
          {withInvite && <SoftInvite onDone={() => setWithInvite(false)} />}
        </div>
      ) : (
        <>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 min-h-[44px] font-mono text-xs tracking-[0.1em] uppercase text-subtle hover:text-foreground transition-colors duration-300 mb-8"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            {t("common.back")}
          </Link>

          <h1 className="text-3xl font-bold tracking-[-0.04em] mb-8">{t("wall.new_prayer")}</h1>

          <NewPrayerForm onSuccess={handleSuccess} />
        </>
      )}
    </main>
  );
}
