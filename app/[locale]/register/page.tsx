import { setRequestLocale } from "next-intl/server";
import { RegisterPageContent } from "@/components/register-page-content";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RegisterPageContent />;
}
