import type { Browser, BrowserContext } from "@playwright/test";
import { BASE_URL } from "./api";
import { uniqueIp } from "./net";

/** A browser profile with its own cookies and its own client IP. */
export async function newPerson(browser: Browser, locale = "es-ES"): Promise<BrowserContext> {
  return browser.newContext({
    baseURL: BASE_URL,
    locale,
    extraHTTPHeaders: { "x-real-ip": uniqueIp() },
  });
}
