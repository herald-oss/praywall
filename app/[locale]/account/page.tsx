import { setRequestLocale } from "next-intl/server";
import { AccountPageContent } from "@/components/account-page-content";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AccountPageContent />;
}
