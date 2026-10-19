import { expect, test, type Page } from "@playwright/test";
import { closeDb, insertPrayer, resetDb } from "../helpers/db";
import { newPerson } from "../helpers/browser";
import { uniqueUsername } from "../helpers/api";

test.beforeEach(resetDb);
test.afterAll(closeDb);

const card = (page: Page, text: string) => page.locator('[data-slot="card"]', { hasText: text });

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

test("praying is remembered after reload; the invite shows once and never redirects", async ({ browser }) => {
  await insertPrayer({ text: "Oren por mi mamá en el hospital" });
  await insertPrayer({ text: "Oren por mi nuevo trabajo" });
  const page = await (await newPerson(browser)).newPage();
  await page.goto("/es");

  await card(page, "Oren por mi mamá").getByRole("button", { name: "Sé el primero en orar" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Guarda tu camino de oración")).toBeVisible();
  await dialog.getByRole("button", { name: "Continuar" }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/es$/);

  // The second prayer still thanks the person, but doesn't invite again.
  await card(page, "Oren por mi nuevo trabajo").getByRole("button", { name: "Sé el primero en orar" }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Guarda tu camino de oración")).toHaveCount(0);
  await dialog.getByRole("button", { name: "Continuar" }).click();

  await page.reload();
  const prayed = card(page, "Oren por mi mamá").getByRole("button", { name: "Oraste por esto" });
  await expect(prayed).toBeVisible();
  await expect(prayed).toBeDisabled();
});

test("own requests: no pray button, share and delete with confirmation", async ({ browser }) => {
  const page = await (await newPerson(browser)).newPage();
  const errors = collectErrors(page);
  await page.goto("/es/new");
  await expect(page.getByLabel("Publicar como anónimo")).toBeChecked();
  await expect(page.getByLabel("Tu nombre")).toHaveCount(0);
  await page.getByPlaceholder("¿Por qué necesitas oración hoy?").fill("Oren por mi examen final");
  // The radio is visually hidden; people click its label.
  await page.locator("label", { hasText: "Trabajo" }).click();
  await expect(page.getByRole("radio", { name: "Trabajo" })).toBeChecked();
  await page.getByRole("button", { name: "Publicar petición" }).click();

  await page.getByRole("link", { name: "Ver mi petición" }).click();
  await expect(page).toHaveURL(/\/es\/prayer\/[0-9a-f-]{36}$/);
  const mine = card(page, "Oren por mi examen final");
  await expect(mine.getByText("Tu petición")).toBeVisible();
  await expect(mine.getByRole("button", { name: /orar/i })).toHaveCount(0);

  await page.goto("/es");
  const onWall = card(page, "Oren por mi examen final");
  const trash = onWall.getByRole("button", { name: "Eliminar" });
  const box = await trash.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
  await trash.click();
  const confirm = page.getByRole("dialog");
  await expect(confirm.getByText("¿Eliminar esta petición?")).toBeVisible();
  await confirm.getByRole("button", { name: "Eliminar" }).click();
  await expect(onWall).toHaveCount(0);

  expect(errors).toEqual([]);
});

test("login errors are translated and the login form doesn't check availability", async ({ browser }) => {
  for (const [locale, path, wrong, message, submit] of [
    ["es-ES", "/es", "Iniciar sesión", "Usuario o contraseña incorrectos.", "Entrar"],
    ["en-US", "/en", "Sign in", "Incorrect username or password.", "Sign in"],
  ] as const) {
    const page = await (await newPerson(browser, locale)).newPage();
    await page.goto(path);
    await page.getByRole("button", { name: wrong }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.locator("#reg-username").fill("nobody_here");
    await page.waitForTimeout(600); // longer than the availability debounce
    await expect(dialog.locator("#reg-username-status")).toBeEmpty();
    await dialog.locator("#reg-password").fill("wrong-password");
    await dialog.getByRole("button", { name: submit, exact: true }).click();
    await expect(page.getByText(message)).toBeVisible();
  }
});

test("after signing out, a shared device forgets the previous person", async ({ browser }) => {
  await insertPrayer({ text: "Oren por la paz en mi ciudad" });
  const page = await (await newPerson(browser)).newPage();
  await page.goto("/es/register");
  await page.locator("#reg-username").fill(uniqueUsername("shared"));
  await page.locator("#reg-password").fill("password123");
  await page.locator("#reg-display-name").fill("Rut");
  await expect(page.getByText("Disponible")).toBeVisible();
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await expect(page).toHaveURL(/\/es$/);

  await card(page, "Oren por la paz").getByRole("button", { name: "Sé el primero en orar" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Continuar" }).click();
  await expect(card(page, "Oren por la paz").getByRole("button", { name: "Oraste por esto" })).toBeVisible();

  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible();
  await page.reload();
  // The next person on this device starts fresh.
  await expect(card(page, "Oren por la paz").getByRole("button", { name: "Oré por esto" })).toBeEnabled();
});

test("the wall loads more prayers on demand", async ({ browser }) => {
  for (let i = 0; i < 40; i++) await insertPrayer({ text: `Petición de prueba número ${i}` });
  const page = await (await newPerson(browser)).newPage();
  await page.goto("/es");
  const cards = page.locator("section").last().locator('[data-slot="card"]');
  await expect(cards).toHaveCount(30);
  await page.getByRole("button", { name: "Ver más peticiones" }).click();
  await expect(cards).toHaveCount(39); // 40 minus the featured prayer shown above
  await expect(page.getByRole("button", { name: "Ver más peticiones" })).toHaveCount(0);
});

test("main pages render without console errors (CSP, hydration)", async ({ browser }) => {
  await insertPrayer({ text: "Oren por mi familia" });
  const page = await (await newPerson(browser)).newPage();
  const errors = collectErrors(page);
  for (const path of ["/es", "/en", "/es/new", "/es/register", "/es/privacy", "/en/terms"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
  expect(errors).toEqual([]);
});
