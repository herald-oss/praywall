"use client";

import { useTranslations } from "next-intl";
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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-[-0.04em]">
            {t("auth.create_account")}
          </DialogTitle>
        </DialogHeader>
        <RegisterForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
