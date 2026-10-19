"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

export function ThemeToggle() {
  const t = useTranslations("common");
  const { theme, setTheme } = useTheme();
  // true on the client, false during SSR — avoids a theme-icon hydration
  // mismatch without a setState-in-effect.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  if (!mounted) {
    return (
      <button
        className="h-10 w-10 rounded-lg flex items-center justify-center text-subtle"
        aria-hidden
      >
        <span className="h-4 w-4" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="h-10 w-10 rounded-lg flex items-center justify-center text-subtle hover:text-foreground transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      aria-label={isDark ? t("theme_light") : t("theme_dark")}
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
