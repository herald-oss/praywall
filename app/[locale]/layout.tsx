import { NextIntlClientProvider, useMessages } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Toaster } from "react-hot-toast";

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
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "hsl(40 12% 12%)",
            color: "hsl(40 10% 96%)",
            border: "1px solid hsl(40 8% 20%)",
          },
        }}
      />
    </NextIntlClientProvider>
  );
}
