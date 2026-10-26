import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

// The wall is an app, not a site to be discovered: the marketing site is the
// one search engines and AI crawlers should find. Every crawl wakes the
// sleeping Railway service, so all crawlers are turned away.
//
// Link-preview bots are the exception, so sharing the wall in WhatsApp,
// Telegram or Facebook still shows a title and description. Prayer requests
// are personal: prayer pages, accounts and the API stay closed to them too
// (those pages also carry a noindex tag).
const PREVIEW_BOTS = [
  "facebookexternalhit", // Facebook, WhatsApp, Instagram, Messenger
  "WhatsApp",
  "TelegramBot",
  "Twitterbot",
  "LinkedInBot",
  "Slackbot-LinkExpanding",
  "Discordbot",
];

export default function robots(): MetadataRoute.Robots {
  const privatePaths = routing.locales.flatMap((l) => [
    `/${l}/prayer/`,
    `/${l}/account`,
    `/${l}/register`,
  ]);
  return {
    rules: [
      { userAgent: PREVIEW_BOTS, allow: "/", disallow: ["/api/", ...privatePaths] },
      { userAgent: "*", disallow: "/" },
    ],
  };
}
