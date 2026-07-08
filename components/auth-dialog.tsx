"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RegisterForm } from "@/components/register-form";

export function AuthDialog({
  open,
  onOpenChange,
  initialMode = "register",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: "register" | "login";
}) {
  const t = useTranslations();
  const [mode, setMode] = useState<"register" | "login">(initialMode);
  const [prevOpen, setPrevOpen] = useState(open);

  // Reset to the mode the trigger asked for each time the dialog reopens —
  // otherwise it'd stay stuck on whatever mode it was last closed in. Adjusted
  // during render (not an effect) per React's recommended pattern for
  // resetting state in response to a prop change.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setMode(initialMode);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-[-0.04em]">
            {mode === "login" ? t("auth.sign_in") : t("auth.create_account")}
          </DialogTitle>
        </DialogHeader>
        <RegisterForm
          mode={mode}
          onModeChange={setMode}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
