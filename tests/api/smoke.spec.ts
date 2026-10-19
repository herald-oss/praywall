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
