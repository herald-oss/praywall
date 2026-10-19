import { expect, test } from "@playwright/test";
import { closeDb, resetDb } from "../helpers/db";
import { newPerson } from "../helpers/browser";
import { BASE_URL } from "../helpers/api";

test.beforeAll(resetDb);
test.afterAll(closeDb);

test("the wall updates live across browsers and survives stream restarts", async ({ browser }) => {
  test.setTimeout(90_000);
  const alice = await newPerson(browser);
  const bob = await newPerson(browser);
  const alicePage = await alice.newPage();
  const bobPage = await bob.newPage();
  await bobPage.goto("/es");
  await expect(bobPage.getByText("Aún no hay peticiones")).toBeVisible();

  // Alice posts through the real form; Bob sees it appear without reloading.
  const text = `Oren por la cirugía de mi papá ${Date.now()}`;
  await alicePage.goto("/es/new");
  await alicePage.getByPlaceholder("¿Por qué necesitas oración hoy?").fill(text);
  await alicePage.getByRole("button", { name: "Publicar petición" }).click();
  await expect(alicePage.getByRole("heading", { name: "Tu oración fue publicada" })).toBeVisible();

  const bobCard = bobPage.locator('[data-slot="card"]', { hasText: text });
  await expect(bobCard).toBeVisible();

  // Bob prays; Alice's wall shows someone is praying, live.
  await alicePage.goto("/es");
  const aliceCard = alicePage.locator('[data-slot="card"]', { hasText: text });
  // Shown once as the featured prayer — never repeated in the wall below.
  await expect(aliceCard).toBeVisible();
  // The wall below has loaded and, excluding the featured prayer, is empty.
  await expect(alicePage.getByText("Aún no hay peticiones")).toBeVisible();
  await expect(aliceCard).toHaveCount(1);
  await bobCard.getByRole("button", { name: "Sé el primero en orar" }).click();
  await expect(aliceCard.getByText("Alguien está orando por esto")).toBeVisible();

  // The server ends each stream after SSE_MAX_LIFETIME_MS (8s in tests).
  // After that, new events must still arrive.
  await bobPage.waitForTimeout(10_000);
  const later = `Oren por mi hermana en el extranjero ${Date.now()}`;
  const post = await alice.request.post("/api/prayers", {
    data: { text: later },
    headers: { origin: BASE_URL },
  });
  expect(post.status()).toBe(201);
  const laterId = (await post.json()).id as string;
  const bobLater = bobPage.locator('[data-slot="card"]', { hasText: later });
  await expect(bobLater).toBeVisible({ timeout: 15_000 });

  // Alice deletes it; it disappears from Bob's wall.
  const del = await alice.request.delete(`/api/prayers/${laterId}`, { headers: { origin: BASE_URL } });
  expect(del.status()).toBe(204);
  await expect(bobLater).toHaveCount(0);

  await alice.close();
  await bob.close();
});
