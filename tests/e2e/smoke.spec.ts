import { expect, test } from "@playwright/test";
import { closeDb, insertPrayer, resetDb } from "../helpers/db";

test.beforeAll(async () => {
  await resetDb();
  await insertPrayer({ text: "Oren por mi hermano que está en el hospital" });
});
test.afterAll(closeDb);

test("home renders the wall in Spanish", async ({ page }) => {
  await page.goto("/es");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Muro de Oración");
  await expect(page.getByText("Oren por mi hermano que está en el hospital").first()).toBeVisible();
});
