import { expect, test } from "@playwright/test";
import { closeDb, insertPrayer, resetDb } from "../helpers/db";

test.beforeAll(async () => {
  await resetDb();
  await insertPrayer({ text: "Oren por la salud de mi mamá" });
});
test.afterAll(closeDb);

test("GET /api/prayers lists public prayers without identifiers", async ({ request }) => {
  const res = await request.get("/api/prayers");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(Array.isArray(body)).toBe(true);
  expect(body[0].text).toBe("Oren por la salud de mi mamá");
  expect(body[0]).not.toHaveProperty("visitorId");
  expect(body[0]).not.toHaveProperty("userId");
});

test("health check responds without touching the database", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ status: "ok" });
});

test("the standalone server serves the built CSS and JS", async ({ request }) => {
  const html = await (await request.get("/es")).text();
  const assets = [...html.matchAll(/\/_next\/static\/[^"' )]+\.(?:css|js)/g)].map((m) => m[0]);
  expect(assets.length).toBeGreaterThan(0);
  for (const asset of assets.slice(0, 5)) {
    expect((await request.get(asset)).status(), asset).toBe(200);
  }
});
