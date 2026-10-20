"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Coffee, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePathname } from "@/i18n/navigation";

// Ko-fi handle. Set NEXT_PUBLIC_KOFI_ID="" to hide the button (e.g. forks).
const RAW_ID = process.env.NEXT_PUBLIC_KOFI_ID ?? "heraldoss";
const KOFI_ID = /^[A-Za-z0-9_]{1,64}$/.test(RAW_ID) ? RAW_ID : "";

// Never next to someone asking for prayer or signing up.
const HIDDEN_ON = ["/new", "/register"];

/**
 * A small, quiet "support the ministry" button. Nothing from Ko-fi loads
 * until it's clicked; then Ko-fi's official donation panel opens in our own
 * dialog (an iframe), so no third-party script ever runs on this site.
 */
export function SupportButton() {
  const t = useTranslations("support");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (!KOFI_ID || HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  const panelUrl = `https://ko-fi.com/${KOFI_ID}/?hidefeed=true&widget=true&embed=true`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("button")}
        className="fixed z-30 left-4 bottom-[max(1rem,env(safe-area-inset-bottom))] inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-border bg-card/80 px-3 text-subtle shadow-sm backdrop-blur-sm transition-colors duration-300 hover:text-foreground hover:border-primary/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Coffee className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline font-mono text-xs tracking-[0.06em]">{t("button")}</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("message")}</DialogDescription>
          </DialogHeader>
          {/* Only rendered (and only requested) while the dialog is open. */}
          {open && (
            <iframe
              src={panelUrl}
              title={t("iframe_title")}
              className="w-full h-[min(620px,65vh)] rounded-lg border-0 bg-white"
            />
          )}
          <a
            href={`https://ko-fi.com/${KOFI_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 min-h-[44px] text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            {t("open_new_tab")}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </DialogContent>
      </Dialog>
    </>
  );
}
