"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Heart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

function getSkipCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes("praywall_skip_register=1");
}

export function PraySuccessDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations();
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  const message = useMemo(() => {
    const messages = [
      t("pray_success.message_1"),
      t("pray_success.message_2"),
      t("pray_success.message_3"),
      t("pray_success.message_4"),
      t("pray_success.message_5"),
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }, [t]);

  function handleContinue() {
    onOpenChange(false);
    if (!isLoggedIn && !getSkipCookie()) {
      router.push("/register");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <div className="flex flex-col items-center text-center py-4 space-y-4">
          <div className="rounded-full bg-primary/10 p-4">
            <Heart className="h-8 w-8 text-primary" />
          </div>
          <p className="text-lg text-foreground font-normal leading-relaxed">
            {message}
          </p>
          <Button
            size="lg"
            className="w-full text-lg font-semibold py-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(var(--glow-color),0.3)]"
            onClick={handleContinue}
          >
            {t("pray_success.continue")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
