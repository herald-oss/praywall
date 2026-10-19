import type { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Toaster } from "react-hot-toast";
import "../globals.css";
import { routing } from "@/i18n/routing";
import { outfit, geistMono } from "@/lib/fonts";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  return {
    metadataBase: appUrl ? new URL(appUrl) : undefined,
    title: { default: t("title"), template: `%s · ${t("site_name")}` },
    description: t("description"),
    applicationName: t("site_name"),
    alternates: {
      canonical: `/${locale}`,
      languages: { es: "/es", en: "/en" },
    },
    openGraph: {
      type: "website",
      siteName: t("site_name"),
      title: t("title"),
      description: t("description"),
      locale: locale === "es" ? "es_ES" : "en_US",
    },
    twitter: { card: "summary", title: t("title"), description: t("description") },
    icons: {
      icon: "/favicon.ico",
      apple: "/icons/apple-touch-icon.png",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#151517",
  colorScheme: "dark light",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${outfit.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <NextIntlClientProvider>
            <Navbar />
            {children}
            <Footer />
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
        </ThemeProvider>
      </body>
    </html>
  );
}
