"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Check, X } from "lucide-react";
import toast from "react-hot-toast";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export function AuthDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations();
  const { signUp, signIn } = useAuth();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check username availability with debounce
  const checkUsername = useCallback(async (value: string) => {
    if (!USERNAME_REGEX.test(value)) {
      setUsernameStatus("invalid");
      return;
    }
    setUsernameStatus("checking");
    try {
      const res = await fetch(
        `/api/auth/check-username?username=${encodeURIComponent(value)}`
      );
      const data = await res.json();
      setUsernameStatus(data.available ? "available" : "taken");
    } catch {
      setUsernameStatus("idle");
    }
  }, []);

  useEffect(() => {
    if (username.length < 3) {
      setUsernameStatus("idle");
      return;
    }
    const timer = setTimeout(() => checkUsername(username), 400);
    return () => clearTimeout(timer);
  }, [username, checkUsername]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        await signUp(username, password, displayName);
        toast.success(t("auth.create_account") + " ✓");
      } else {
        await signIn(username, password);
        toast.success(t("auth.sign_in") + " ✓");
      }
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("auth.error")
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setUsername("");
    setPassword("");
    setDisplayName("");
    setUsernameStatus("idle");
    setMode("register");
  }

  const canSubmitRegister =
    usernameStatus === "available" &&
    password.length >= 8 &&
    displayName.trim().length > 0;

  const canSubmitLogin = username.length >= 3 && password.length >= 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-[-0.04em]">
            {mode === "register"
              ? t("auth.create_account")
              : t("auth.sign_in")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label
              htmlFor="auth-username"
              className="font-mono text-xs tracking-[0.1em] uppercase text-subtle mb-2 block"
            >
              {t("auth.username")}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle text-base">
                @
              </span>
              <input
                id="auth-username"
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().slice(0, 20))
                }
                placeholder={t("auth.username_placeholder")}
                maxLength={20}
                autoComplete="username"
                className="w-full rounded-lg border border-input bg-background pl-8 pr-10 py-2.5 text-base font-normal text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
              />
              {usernameStatus === "available" && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
              {usernameStatus === "taken" && (
                <X className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
              )}
            </div>
            {mode === "register" && usernameStatus === "taken" && (
              <p className="text-xs text-destructive mt-1">
                {t("auth.username_taken")}
              </p>
            )}
            {mode === "register" && usernameStatus === "invalid" && username.length >= 3 && (
              <p className="text-xs text-destructive mt-1">
                {t("auth.username_invalid")}
              </p>
            )}
            {mode === "register" && usernameStatus === "available" && (
              <p className="text-xs text-green-500 mt-1">
                {t("auth.username_available")}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="auth-password"
              className="font-mono text-xs tracking-[0.1em] uppercase text-subtle mb-2 block"
            >
              {t("auth.password")}
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base font-normal text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
            />
            {mode === "register" &&
              password.length > 0 &&
              password.length < 8 && (
                <p className="text-xs text-destructive mt-1">
                  {t("auth.password_short")}
                </p>
              )}
          </div>

          {/* Display name (register only) */}
          {mode === "register" && (
            <div>
              <label
                htmlFor="auth-display-name"
                className="font-mono text-xs tracking-[0.1em] uppercase text-subtle mb-2 block"
              >
                {t("auth.display_name")}
              </label>
              <input
                id="auth-display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.slice(0, 30))}
                placeholder={t("auth.display_name_placeholder")}
                maxLength={30}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base font-normal text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
              />
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full gap-2 text-lg font-semibold py-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(var(--glow-color),0.3)]"
            disabled={
              isSubmitting ||
              (mode === "register" ? !canSubmitRegister : !canSubmitLogin)
            }
          >
            {mode === "register" ? t("auth.register") : t("auth.login")}
          </Button>
        </form>

        {/* Toggle mode */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setMode(mode === "register" ? "login" : "register")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
          >
            {mode === "register"
              ? t("auth.sign_in")
              : t("auth.create_account")}
          </button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
