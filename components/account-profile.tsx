"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
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
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "@/i18n/navigation";
import { DISPLAY_NAME_MAX_CHARS, PASSWORD_MAX_CHARS, PASSWORD_MIN_CHARS } from "@/lib/constants";
import { codeOf, errorMessageKey } from "@/lib/errors";

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-ring";
const labelClass = "font-mono text-xs tracking-[0.1em] uppercase text-subtle mb-2 block";
const sectionClass = "rounded-lg border border-border p-5 space-y-4";

export function AccountProfile() {
  const t = useTranslations();
  const router = useRouter();
  const { user, updateDisplayName, changePassword, deleteAccount } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  if (!user) return null;

  async function handleName(e: React.FormEvent) {
    e.preventDefault();
    if (savingName || !name.trim()) return;
    setSavingName(true);
    try {
      await updateDisplayName(name.trim());
      toast.success(t("account.name_saved"));
    } catch (error) {
      toast.error(t(errorMessageKey(codeOf(error))));
    } finally {
      setSavingName(false);
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (savingPassword) return;
    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      toast.success(t("account.password_saved"));
    } catch (error) {
      toast.error(t(errorMessageKey(codeOf(error))));
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!deletePassword || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteAccount(deletePassword);
      toast.success(t("account.delete_success"));
      router.push("/");
    } catch (error) {
      const code = codeOf(error);
      toast.error(
        code === "invalid_password" || code === "generic"
          ? t("account.delete_error")
          : t(errorMessageKey(code))
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleName} className={sectionClass}>
        <div>
          <label htmlFor="profile-name" className={labelClass}>
            {t("account.profile_title")}
          </label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, DISPLAY_NAME_MAX_CHARS))}
            maxLength={DISPLAY_NAME_MAX_CHARS}
            autoComplete="nickname"
            aria-describedby="profile-name-help"
            className={inputClass}
          />
          <p id="profile-name-help" className="mt-1 text-xs text-subtle">
            {t("account.profile_help")}
          </p>
        </div>
        <Button type="submit" disabled={savingName || !name.trim() || name.trim() === user.name}>
          {t("account.save")}
        </Button>
      </form>

      <form onSubmit={handlePassword} className={sectionClass}>
        <h2 className="font-mono text-xs tracking-[0.1em] uppercase text-subtle">
          {t("account.password_title")}
        </h2>
        {/* Lets password managers attach the new password to this account. */}
        <input type="text" name="username" autoComplete="username" value={user.username} readOnly hidden />
        <div>
          <label htmlFor="current-password" className={labelClass}>
            {t("account.current_password")}
          </label>
          <input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value.slice(0, PASSWORD_MAX_CHARS))}
            autoComplete="current-password"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="new-password" className={labelClass}>
            {t("account.new_password")}
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value.slice(0, PASSWORD_MAX_CHARS))}
            autoComplete="new-password"
            aria-describedby="new-password-help"
            className={inputClass}
          />
          <p id="new-password-help" className="mt-1 text-xs text-subtle">
            {t("account.password_help")}
          </p>
        </div>
        <Button
          type="submit"
          disabled={savingPassword || !currentPassword || newPassword.length < PASSWORD_MIN_CHARS}
        >
          {t("account.save")}
        </Button>
      </form>

      <div className="rounded-lg border border-destructive/30 p-5 space-y-4">
        <div>
          <h2 className="font-mono text-xs tracking-[0.1em] uppercase text-destructive mb-1">
            {t("account.delete_title")}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("account.delete_description")}
          </p>
        </div>
        <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
          {t("account.delete_cta")}
        </Button>
      </div>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeletePassword("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("account.delete_title")}</DialogTitle>
            <DialogDescription>{t("account.delete_description")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDelete} className="space-y-3">
            <label htmlFor="delete-password" className="sr-only">
              {t("auth.password")}
            </label>
            <input
              id="delete-password"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder={t("auth.password")}
              autoComplete="current-password"
              className={inputClass}
            />
            <DialogFooter className="-mx-0 -mb-0 rounded-b-none border-t-0 bg-transparent p-0 sm:justify-start">
              <Button type="submit" variant="destructive" disabled={!deletePassword || isDeleting}>
                {t("account.delete_confirm_cta")}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setDeleteOpen(false)}>
                {t("account.cancel")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
