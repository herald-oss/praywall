import { expect, test } from "@playwright/test";
import { closeDb, insertPrayer, resetDb } from "../helpers/db";
import { newPerson } from "../helpers/browser";

test.beforeAll(async () => {
  await resetDb();
  await insertPrayer({ text: "Oren por nuestra iglesia" });
});
test.afterAll(closeDb);

test("Ko-fi loads nothing until clicked, then opens the official panel", async ({ browser }) => {
  const page = await (await newPerson(browser)).newPage();
  const kofiRequests: string[] = [];
  const consoleErrors: string[] = [];
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
  // Stand in for ko-fi.com so the test doesn't depend on the network.
  await page.route(/ko-fi\.com/, (route) => {
    kofiRequests.push(route.request().url());
    return route.fulfill({ status: 200, contentType: "text/html", body: "<p>Ko-fi panel</p>" });
  });

  await page.goto("/es");
  await expect(page.getByText("Oren por nuestra iglesia").first()).toBeVisible();
  await page.waitForTimeout(1000);
  expect(kofiRequests).toEqual([]);

  await page.getByRole("button", { name: "Apoyar el ministerio" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("es voluntario", { exact: false })).toBeVisible();
  const frame = dialog.locator('iframe[title="Panel de donación de Ko-fi"]');
  await expect(frame).toHaveAttribute("src", /^https:\/\/ko-fi\.com\/heraldoss\//);
  await expect(page.frameLocator('iframe[title="Panel de donación de Ko-fi"]').getByText("Ko-fi panel")).toBeVisible();
  expect(kofiRequests.length).toBeGreaterThan(0);
  expect(consoleErrors.filter((e) => /Content Security Policy|Refused/.test(e))).toEqual([]);
});

test("the support button stays away from asking for prayer and signing up", async ({ browser }) => {
  const page = await (await newPerson(browser)).newPage();
  for (const path of ["/es/new", "/es/register"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "Apoyar el ministerio" })).toHaveCount(0);
  }
  await page.goto("/en/privacy");
  await expect(page.getByRole("button", { name: "Support the ministry" })).toBeVisible();
});
