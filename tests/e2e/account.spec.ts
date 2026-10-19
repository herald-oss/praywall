import { expect, test } from "@playwright/test";
import { closeDb, resetDb } from "../helpers/db";
import { newPerson } from "../helpers/browser";
import { BASE_URL, uniqueUsername } from "../helpers/api";

test.beforeAll(resetDb);
test.afterAll(closeDb);

test("account tabs: testimony stays private; profile name can change", async ({ browser }) => {
  const ctx = await newPerson(browser);
  const page = await ctx.newPage();
  await page.goto("/es/register");
  await page.locator("#reg-username").fill(uniqueUsername("acc"));
  await page.locator("#reg-password").fill("password123");
  await page.locator("#reg-display-name").fill("Marta");
  await expect(page.getByText("Disponible")).toBeVisible();
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await expect(page).toHaveURL(/\/es$/);

  const text = `Oren por la salud de mi hijo ${Date.now()}`;
  const post = await page.request.post("/api/prayers", {
    data: { text, isAnonymous: false },
    headers: { origin: BASE_URL },
  });
  expect(post.status()).toBe(201);

  await page.goto("/es/account");
  const mine = page.locator('[data-slot="card"]', { hasText: text });
  await mine.getByRole("button", { name: "Marcar como respondida" }).click();
  await mine.getByLabel("Cuenta cómo Dios respondió esta oración...").fill("¡Ya salió del hospital!");
  await mine.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Testimonio guardado.")).toBeVisible();

  await page.getByRole("tab", { name: "Contestadas" }).click();
  await expect(page.getByText("¡Ya salió del hospital!")).toBeVisible();

  // Someone else sees the request, but never the testimony.
  const stranger = await (await newPerson(browser)).newPage();
  await stranger.goto("/es");
  await expect(stranger.getByText(text).first()).toBeVisible();
  await expect(stranger.getByText("¡Ya salió del hospital!")).toHaveCount(0);

  // Profile: change the display name.
  await page.getByRole("tab", { name: "Perfil" }).click();
  await page.locator("#profile-name").fill("Marta G.");
  await page.locator("form", { has: page.locator("#profile-name") }).getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Nombre actualizado.")).toBeVisible();
  await page.reload();
  await page.getByRole("tab", { name: "Perfil" }).click();
  await expect(page.locator("#profile-name")).toHaveValue("Marta G.");
});
