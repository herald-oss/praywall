import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

// Prayer requests are personal. Individual prayer pages, accounts and the
// API are never crawled; those pages also carry a noindex tag.
export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const privatePaths = routing.locales.flatMap((l) => [
    `/${l}/prayer/`,
    `/${l}/account`,
    `/${l}/register`,
  ]);
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", ...privatePaths] }],
    sitemap: appUrl ? `${appUrl}/sitemap.xml` : undefined,
  };
}
