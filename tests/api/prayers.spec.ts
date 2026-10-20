import { expect, test, type APIRequestContext } from "@playwright/test";
import { closeDb, insertPrayer, resetDb, testDb } from "../helpers/db";
import { uniqueIp } from "../helpers/net";
import { BASE_URL, login, newClient, signup, uniqueUsername } from "../helpers/api";

test.beforeAll(resetDb);
test.afterAll(closeDb);

function post(client: APIRequestContext, data: Record<string, unknown>) {
  return client.post("/api/prayers", { data, headers: { origin: BASE_URL } });
}

function pray(client: APIRequestContext, prayerId: string) {
  return client.post("/api/intercede", { data: { prayerId }, headers: { origin: BASE_URL } });
}

async function count(prayerId: string): Promise<number> {
  const { rows } = await testDb().query("SELECT intercessor_count FROM prayers WHERE id = $1", [prayerId]);
  return rows[0].intercessor_count;
}

test.describe("POST /api/prayers", () => {
  test("creates a prayer owned by this browser", async ({ playwright }) => {
    const client = await newClient(playwright);
    const res = await post(client, { text: "Oren por mi abuela", isAnonymous: true, category: "health" });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({ text: "Oren por mi abuela", canManage: true, viewerHasPrayed: false, category: "health" });
    expect(body).not.toHaveProperty("visitorId");
    expect(res.headers()["set-cookie"]).toContain("praywall_visitor=");
  });

  test("rejects wrong types instead of crashing", async ({ playwright }) => {
    const client = await newClient(playwright);
    for (const data of [{ text: 123 }, { text: "Hola", isAnonymous: "no" }, { text: "Hola", name: 5 }]) {
      const res = await post(client, data);
      expect(res.status()).toBe(400);
      expect((await res.json()).error).toBe("invalid_input");
    }
  });

  test("moderates text and names", async ({ playwright }) => {
    const client = await newClient(playwright);
    const cases: [Record<string, unknown>, string][] = [
      [{ text: "eres una puta" }, "inappropriate_content"],
      [{ text: "compra en www.spam.com" }, "spam"],
      [{ text: "   " }, "empty"],
      [{ text: "x".repeat(281) }, "too_long"],
      [{ text: "Oren por mí", isAnonymous: false, name: "puta" }, "inappropriate_content"],
    ];
    for (const [data, code] of cases) {
      const res = await post(client, data);
      expect(res.status(), code).toBe(400);
      expect((await res.json()).error).toBe(code);
    }
  });

  test("logged-in users post under their account name, never a client-sent one", async ({ playwright }) => {
    const client = await newClient(playwright);
    await signup(client, { username: uniqueUsername("named"), displayName: "Lucía" });
    const res = await post(client, { text: "Oren por mi trabajo", isAnonymous: false, name: "Pastor Juan" });
    expect((await res.json()).displayName).toBe("Lucía");
  });

  test("dedupes a double submit, but never hands another person's prayer back", async ({ playwright }) => {
    const clientRequestId = crypto.randomUUID();
    const author = await newClient(playwright);
    const first = await post(author, { text: "Oren por mi viaje", clientRequestId });
    const again = await post(author, { text: "Oren por mi viaje", clientRequestId });
    expect(first.status()).toBe(201);
    expect(again.status()).toBe(200);
    expect((await again.json()).id).toBe((await first.json()).id);

    const replay = await post(await newClient(playwright), { text: "Oren por mi viaje", clientRequestId });
    expect(replay.status()).toBe(409);
    const body = await replay.json();
    expect(body).not.toHaveProperty("canManage");
    expect(body).not.toHaveProperty("testimony");
  });

  test("limits posts per browser and per network", async ({ playwright }) => {
    const browser = await newClient(playwright);
    for (let i = 0; i < 5; i++) {
      expect((await post(browser, { text: `Petición número ${i}` })).status()).toBe(201);
    }
    expect((await post(browser, { text: "Una más" })).status()).toBe(429);

    // Without cookies every request looks like a new browser — the IP cap still holds.
    const ip = uniqueIp();
    for (let i = 0; i < 10; i++) {
      const fresh = await newClient(playwright, { ip });
      expect((await post(fresh, { text: `Oración ${i}` })).status()).toBe(201);
    }
    expect((await post(await newClient(playwright, { ip }), { text: "Otra" })).status()).toBe(429);
  });
});

test.describe("POST /api/intercede", () => {
  test("counts once per person and reports the state", async ({ playwright }) => {
    const prayerId = await insertPrayer({});
    const client = await newClient(playwright);

    const first = await pray(client, prayerId);
    expect(first.status()).toBe(200);
    expect(await first.json()).toMatchObject({ count: 1, alreadyPrayed: false, ownPrayer: false });

    const second = await pray(client, prayerId);
    expect(await second.json()).toMatchObject({ count: 1, alreadyPrayed: true });
    expect(await count(prayerId)).toBe(1);

    const wall = await (await client.get("/api/prayers")).json();
    expect(wall.find((p: { id: string }) => p.id === prayerId).viewerHasPrayed).toBe(true);
  });

  test("parallel intercessions keep the counter exact", async ({ playwright }) => {
    const prayerId = await insertPrayer({});
    const clients = await Promise.all(Array.from({ length: 20 }, () => newClient(playwright)));
    const results = await Promise.all(clients.map((c) => pray(c, prayerId)));
    expect(results.every((r) => r.status() === 200)).toBe(true);

    const { rows } = await testDb().query(
      "SELECT count(*)::int AS n FROM intercessions WHERE prayer_id = $1",
      [prayerId]
    );
    expect(rows[0].n).toBe(20);
    expect(await count(prayerId)).toBe(20);
  });

  test("the goal flips exactly at 33", async ({ playwright }) => {
    const prayerId = await insertPrayer({ intercessorCount: 32 });
    const res = await pray(await newClient(playwright), prayerId);
    expect(await res.json()).toMatchObject({ count: 33, goalReached: true });
  });

  test("the same account counts once across devices", async ({ playwright }) => {
    const prayerId = await insertPrayer({});
    const username = uniqueUsername("dev");
    const phone = await newClient(playwright);
    await signup(phone, { username });
    expect((await (await pray(phone, prayerId)).json()).alreadyPrayed).toBe(false);

    const laptop = await newClient(playwright);
    await login(laptop, username);
    expect((await (await pray(laptop, prayerId)).json()).alreadyPrayed).toBe(true);
    expect(await count(prayerId)).toBe(1);
  });

  test("the author can't count toward their own goal", async ({ playwright }) => {
    const author = await newClient(playwright);
    const prayerId = (await (await post(author, { text: "Oren por mi examen" })).json()).id;
    const res = await pray(author, prayerId);
    expect(await res.json()).toMatchObject({ ownPrayer: true, count: 0 });
    expect(await count(prayerId)).toBe(0);
  });

  test("bad ids are 400 and archived prayers are 404", async ({ playwright }) => {
    const client = await newClient(playwright);
    expect((await pray(client, "not-a-uuid")).status()).toBe(400);

    const archived = await insertPrayer({});
    await testDb().query("UPDATE prayers SET archived_at = now() WHERE id = $1", [archived]);
    expect((await pray(client, archived)).status()).toBe(404);
  });

  test("a cookie-less flood from one network is capped per prayer", async ({ playwright }) => {
    const prayerId = await insertPrayer({});
    const ip = uniqueIp();
    for (let i = 0; i < 40; i++) {
      expect((await pray(await newClient(playwright, { ip }), prayerId)).status()).toBe(200);
    }
    expect((await pray(await newClient(playwright, { ip }), prayerId)).status()).toBe(429);
    expect(await count(prayerId)).toBe(40);
  });
});

test.describe("managing a prayer", () => {
  test("only the owner can delete; strangers and bad ids get 404", async ({ playwright }) => {
    const owner = await newClient(playwright);
    const id = (await (await post(owner, { text: "Oren por mi hijo" })).json()).id;
    const del = (c: APIRequestContext, target: string) =>
      c.delete(`/api/prayers/${target}`, { headers: { origin: BASE_URL } });

    expect((await del(await newClient(playwright), id)).status()).toBe(404);
    expect((await del(owner, "not-a-uuid")).status()).toBe(404);
    expect((await del(owner, id)).status()).toBe(204);

    const wall = await (await owner.get("/api/prayers")).json();
    expect(wall.some((p: { id: string }) => p.id === id)).toBe(false);
  });

  test("testimony is saved for the owner and hidden from everyone else", async ({ playwright }) => {
    const owner = await newClient(playwright);
    const id = (await (await post(owner, { text: "Oren por sanidad" })).json()).id;

    const res = await owner.patch(`/api/prayers/${id}`, {
      data: { testimony: "¡Dios me sanó!" },
      headers: { origin: BASE_URL },
    });
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ testimony: "¡Dios me sanó!" });

    const stranger = await newClient(playwright);
    const strangerPatch = await stranger.patch(`/api/prayers/${id}`, {
      data: { testimony: "hack" },
      headers: { origin: BASE_URL },
    });
    expect(strangerPatch.status()).toBe(404);
    const wall = await (await stranger.get("/api/prayers")).json();
    const seen = wall.find((p: { id: string }) => p.id === id);
    expect(seen.testimony).toBeNull();
    expect(seen.answeredAt).not.toBeNull();
  });
});

test.describe("account prayers", () => {
  test("requires a session", async ({ playwright }) => {
    const res = await (await newClient(playwright)).get("/api/account/prayers");
    expect(res.status()).toBe(401);
  });

  test("lists own prayers and prayers interceded from any device", async ({ playwright }) => {
    const username = uniqueUsername("acct");
    const phone = await newClient(playwright);
    await signup(phone, { username });
    const mine = (await (await post(phone, { text: "Oren por mi esposa" })).json()).id;

    const other = await insertPrayer({ text: "Oren por mi país" });
    const laptop = await newClient(playwright);
    await login(laptop, username);
    await pray(laptop, other);

    const data = await (await phone.get("/api/account/prayers")).json();
    expect(data.myPrayers.map((p: { id: string }) => p.id)).toContain(mine);
    const interceded = data.intercededPrayers.find((p: { id: string }) => p.id === other);
    expect(interceded?.viewerHasPrayed).toBe(true);
  });
});

test("wall pagination supports offset and excluding the featured prayer", async ({ playwright }) => {
  const client = await newClient(playwright);
  const all = await (await client.get("/api/prayers")).json();
  expect(all.length).toBeGreaterThan(1);
  const excluded = await (await client.get(`/api/prayers?exclude=${all[0].id}`)).json();
  expect(excluded.some((p: { id: string }) => p.id === all[0].id)).toBe(false);
  const page2 = await (await client.get("/api/prayers?offset=1")).json();
  expect(page2[0].id).toBe(all[1].id);
});

test("a malformed prayer URL is a 404 page, not a server error", async ({ playwright }) => {
  const res = await (await newClient(playwright)).get("/es/prayer/not-a-uuid");
  expect(res.status()).toBe(404);
});

test("GET /api/prayers?ids= returns only those visible prayers", async ({ playwright }) => {
  const a = await insertPrayer({ text: "Uno" });
  const b = await insertPrayer({ text: "Dos" });
  await testDb().query("UPDATE prayers SET archived_at = now() WHERE id = $1", [b]);
  const res = await (await newClient(playwright)).get(`/api/prayers?ids=${a},${b},not-a-uuid`);
  const body = await res.json();
  expect(body.map((p: { id: string }) => p.id)).toEqual([a]);
});

test("deleting a prayer also removes its testimony", async ({ playwright }) => {
  const owner = await newClient(playwright);
  const id = (await (await post(owner, { text: "Oren por mi matrimonio" })).json()).id;
  await owner.patch(`/api/prayers/${id}`, {
    data: { testimony: "Nos reconciliamos" },
    headers: { origin: BASE_URL },
  });
  await owner.delete(`/api/prayers/${id}`, { headers: { origin: BASE_URL } });
  const { rows } = await testDb().query("SELECT testimony, archived_at FROM prayers WHERE id = $1", [id]);
  expect(rows[0].testimony).toBeNull();
  expect(rows[0].archived_at).not.toBeNull();
});

test("a shared browser cookie never reveals another account's intercessions", async ({ playwright }) => {
  const prayerId = await insertPrayer({ text: "Oren por mi abuelo" });
  const visitor = crypto.randomUUID();
  const a = await newClient(playwright, { cookie: `praywall_visitor=${visitor}` });
  await signup(a, { username: uniqueUsername("sha") });
  await pray(a, prayerId);

  // Same browser cookie, but A's session is gone (expired, never signed out).
  const next = await newClient(playwright, { cookie: `praywall_visitor=${visitor}` });
  const wall = await (await next.get("/api/prayers")).json();
  expect(wall.find((p: { id: string }) => p.id === prayerId).viewerHasPrayed).toBe(false);
});
