import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return routing.locales.flatMap((locale) =>
    ["", "/privacy", "/terms"].map((path) => ({
      url: `${appUrl}/${locale}${path}`,
      changeFrequency: path ? ("yearly" as const) : ("daily" as const),
    }))
  );
}
