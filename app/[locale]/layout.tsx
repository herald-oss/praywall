import { NextIntlClientProvider, useMessages } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Toaster } from "react-hot-toast";
import { ThemeToggle } from "@/components/theme-toggle";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <NextIntlClientProvider locale={locale}>
      {children}
      <div className="fixed top-4 right-4 z-40">
        <ThemeToggle />
      </div>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "var(--card)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
            fontFamily: "var(--font-geist-mono)",
            fontSize: "12px",
            letterSpacing: "0.05em",
          },
        }}
      />
    </NextIntlClientProvider>
  );
}
