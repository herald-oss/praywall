"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  DISPLAY_NAME_MAX_CHARS,
  PASSWORD_MAX_CHARS,
  PASSWORD_MIN_CHARS,
  USERNAME_REGEX,
} from "@/lib/constants";
import { codeOf, errorMessageKey } from "@/lib/errors";

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

const inputClass =
  "w-full rounded-lg border border-input bg-background py-2.5 text-base font-normal text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300";
const labelClass = "font-mono text-xs tracking-[0.1em] uppercase text-subtle mb-2 block";

export function RegisterForm({
  onSuccess,
  mode,
  onModeChange,
}: {
  onSuccess?: () => void;
  mode: "register" | "login";
  onModeChange: (mode: "register" | "login") => void;
}) {
  const t = useTranslations();
  const { signUp, signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRegister = mode === "register";

  const checkUsername = useCallback(async (value: string) => {
    if (!USERNAME_REGEX.test(value)) {
      setUsernameStatus("invalid");
      return;
    }
    setUsernameStatus("checking");
    try {
      const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(value)}`);
      const data = await res.json();
      setUsernameStatus(data.available ? "available" : "taken");
    } catch {
      setUsernameStatus("idle");
    }
  }, []);

  // Availability only matters when creating an account. On the login form
  // it would show a red ✗ for an existing (correct) username.
  useEffect(() => {
    if (!isRegister || username.length < 3) return;
    const timer = setTimeout(() => checkUsername(username), 400);
    return () => clearTimeout(timer);
  }, [username, checkUsername, isRegister]);

  const status: UsernameStatus = isRegister && username.length >= 3 ? usernameStatus : "idle";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (isRegister) {
        await signUp(username, password, displayName.trim());
        toast.success(t("auth.welcome", { name: displayName.trim() }));
      } else {
        await signIn(username, password);
        toast.success(t("auth.signed_in"));
      }
      onSuccess?.();
    } catch (error) {
      toast.error(t(errorMessageKey(codeOf(error))));
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmitRegister =
    status === "available" &&
    password.length >= PASSWORD_MIN_CHARS &&
    displayName.trim().length > 0;
  const canSubmitLogin = username.length >= 3 && password.length >= 1;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div>
          <label htmlFor="reg-username" className={labelClass}>
            {t("auth.username")}
          </label>
          <div className="relative">
            <span aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle text-base">
              @
            </span>
            <input
              id="reg-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().slice(0, 20))}
              placeholder={t("auth.username_placeholder")}
              maxLength={20}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              aria-describedby={isRegister ? "reg-username-status" : undefined}
              className={`${inputClass} pl-8 pr-10`}
            />
            {status === "available" && (
              <Check aria-hidden className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
            )}
            {status === "taken" && (
              <X aria-hidden className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
            )}
          </div>
          <p id="reg-username-status" aria-live="polite" className="text-xs mt-1 min-h-4">
            {status === "taken" && <span className="text-destructive">{t("auth.username_taken")}</span>}
            {status === "invalid" && <span className="text-destructive">{t("auth.username_invalid")}</span>}
            {status === "available" && <span className="text-green-500">{t("auth.username_available")}</span>}
          </p>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="reg-password" className={labelClass}>
            {t("auth.password")}
          </label>
          <div className="relative">
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value.slice(0, PASSWORD_MAX_CHARS))}
              autoComplete={isRegister ? "new-password" : "current-password"}
              aria-describedby={isRegister ? "reg-password-hint" : undefined}
              className={`${inputClass} px-3 pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t("auth.hide_password") : t("auth.show_password")}
              aria-pressed={showPassword}
              className="absolute right-0 top-1/2 -translate-y-1/2 h-11 w-11 inline-flex items-center justify-center text-subtle hover:text-foreground transition-colors duration-300"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {isRegister && (
            <div id="reg-password-hint" className="mt-1 space-y-1">
              {password.length > 0 && password.length < PASSWORD_MIN_CHARS && (
                <p className="text-xs text-destructive">{t("auth.password_short")}</p>
              )}
              <p className="text-xs text-subtle">{t("auth.no_recovery")}</p>
            </div>
          )}
        </div>

        {/* Display name (register only) */}
        {isRegister && (
          <div>
            <label htmlFor="reg-display-name" className={labelClass}>
              {t("auth.display_name")}
            </label>
            <input
              id="reg-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.slice(0, DISPLAY_NAME_MAX_CHARS))}
              placeholder={t("auth.display_name_placeholder")}
              maxLength={DISPLAY_NAME_MAX_CHARS}
              autoComplete="nickname"
              className={`${inputClass} px-3`}
            />
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full gap-2 text-lg font-semibold py-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(var(--glow-color),0.3)]"
          disabled={isSubmitting || (isRegister ? !canSubmitRegister : !canSubmitLogin)}
        >
          {isRegister ? t("auth.register") : t("auth.login")}
        </Button>
      </form>

      {/* Toggle mode */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => onModeChange(isRegister ? "login" : "register")}
          className="min-h-[44px] px-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
        >
          {isRegister ? t("auth.sign_in") : t("auth.create_account")}
        </button>
      </div>
    </div>
  );
}
