import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("not_found");
  return (
    <main className="flex-1 flex flex-col items-center justify-center text-center max-w-lg mx-auto w-full px-6 py-16 space-y-4">
      <p className="font-mono text-xs tracking-[0.1em] uppercase text-subtle">404</p>
      <h1 className="text-3xl font-bold tracking-[-0.04em]">{t("title")}</h1>
      <p className="text-muted-foreground">{t("message")}</p>
      <Link
        href="/"
        className="inline-flex items-center justify-center min-h-[44px] rounded-lg bg-primary px-6 py-3 font-mono text-xs tracking-[0.1em] uppercase font-medium text-primary-foreground transition-colors duration-300 hover:bg-primary/80"
      >
        {t("home")}
      </Link>
    </main>
  );
}
