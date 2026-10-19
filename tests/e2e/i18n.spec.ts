import { expect, test } from "@playwright/test";
import { closeDb, insertPrayer, resetDb } from "../helpers/db";
import { newPerson } from "../helpers/browser";

let prayerId: string;
test.beforeAll(async () => {
  await resetDb();
  prayerId = await insertPrayer({ text: "Oren por mi comunidad" });
});
test.afterAll(closeDb);

test("each locale sets the document language and keeps it in links", async ({ browser }) => {
  const page = await (await newPerson(browser, "en-US")).newPage();
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Prayer Wall");
  await expect(page.getByRole("link", { name: "Request prayer" })).toHaveAttribute("href", "/en/new");

  await page.goto("/es");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
});

test("the language switcher stays on the same page", async ({ browser }) => {
  const page = await (await newPerson(browser)).newPage();
  await page.goto("/es/privacy");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Política de privacidad");
  await page.getByRole("button", { name: "Cambiar idioma a English" }).click();
  await expect(page).toHaveURL(/\/en\/privacy$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy Policy");
});

test("unknown pages and malformed prayer ids show a translated 404", async ({ browser }) => {
  const page = await (await newPerson(browser)).newPage();
  const res = await page.goto("/es/prayer/abc");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Página no encontrada" })).toBeVisible();

  const unknown = await page.goto("/en/does-not-exist");
  expect(unknown?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});

test("personal pages are not indexable", async ({ browser }) => {
  const page = await (await newPerson(browser)).newPage();
  await page.goto(`/es/prayer/${prayerId}`);
  await expect(page.getByRole("heading", { name: "Petición de oración" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

  const robots = await (await page.request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /es/prayer/");
});

test("the manifest and its icons exist", async ({ request }) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  for (const icon of manifest.icons) {
    expect((await request.get(icon.src)).status(), icon.src).toBe(200);
  }
});
