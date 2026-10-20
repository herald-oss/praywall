"use client";

import { useTranslations } from "next-intl";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SoftInvite } from "@/components/soft-invite";
import { useAuth } from "@/hooks/use-auth";
import { markInviteShown, shouldShowInvite } from "@/lib/invite";

// One "thank you for praying" dialog for the whole app, instead of one per
// prayer card. Anyone can trigger it with usePraySuccess().

const MESSAGE_COUNT = 5;
const PraySuccessContext = createContext<(() => void) | null>(null);

export function PraySuccessProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("pray_success");
  const { isLoggedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [messageIndex, setMessageIndex] = useState(1);
  const [withInvite, setWithInvite] = useState(false);

  const celebrate = useCallback(() => {
    setMessageIndex(1 + Math.floor(Math.random() * MESSAGE_COUNT));
    const invite = !isLoggedIn && shouldShowInvite();
    if (invite) markInviteShown();
    setWithInvite(invite);
    setOpen(true);
  }, [isLoggedIn]);

  return (
    <PraySuccessContext.Provider value={celebrate}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <div className="flex flex-col items-center text-center py-4 space-y-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Heart className="h-8 w-8 text-primary" aria-hidden />
            </div>
            <DialogTitle className="text-lg text-foreground font-normal leading-relaxed">
              {t(`message_${messageIndex}` as "message_1")}
            </DialogTitle>
            {withInvite && <SoftInvite onDone={() => setOpen(false)} />}
            <Button
              size="lg"
              variant={withInvite ? "secondary" : "default"}
              className="w-full text-lg font-semibold py-4"
              onClick={() => setOpen(false)}
            >
              {t("continue")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PraySuccessContext.Provider>
  );
}

export function usePraySuccess(): () => void {
  return useContext(PraySuccessContext) ?? noop;
}

function noop() {}
