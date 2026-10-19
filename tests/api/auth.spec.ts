import { expect, test } from "@playwright/test";
import { closeDb, insertPrayer, resetDb, testDb } from "../helpers/db";
import { uniqueIp } from "../helpers/net";
import {
  BASE_URL,
  login,
  newClient,
  setCookieHeaders,
  signup,
  uniqueUsername,
} from "../helpers/api";

test.beforeAll(resetDb);
test.afterAll(closeDb);

test.describe("native Better-Auth endpoints are locked down", () => {
  for (const path of [
    "/sign-up/email",
    "/sign-in/email",
    "/sign-in/anonymous",
    "/update-user",
    "/change-email",
  ]) {
    test(`POST /api/auth${path} returns 404`, async ({ playwright }) => {
      const client = await newClient(playwright);
      const res = await client.post(`/api/auth${path}`, {
        data: { email: "x@praywall.local", password: "password123", name: "Mallory" },
        headers: { origin: BASE_URL },
      });
      expect(res.status()).toBe(404);
    });
  }

  test("GET /api/auth/get-session returns 404", async ({ playwright }) => {
    const client = await newClient(playwright);
    expect((await client.get("/api/auth/get-session")).status()).toBe(404);
  });
});

test.describe("signup", () => {
  test("creates the account, logs in, and never returns the token", async ({ playwright }) => {
    const client = await newClient(playwright);
    const username = uniqueUsername("ana");
    const res = await signup(client, { username, displayName: "Ana" });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).not.toHaveProperty("token");
    expect(body.user).toMatchObject({ username, name: "Ana" });

    const session = await (await client.get("/api/auth/session")).json();
    expect(session.user).toMatchObject({ username, name: "Ana" });
  });

  test("rejects wrong types with invalid_input", async ({ playwright }) => {
    const client = await newClient(playwright);
    const res = await client.post("/api/auth/signup", {
      data: { username: uniqueUsername(), password: 12345678, displayName: "Ana" },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toBe("invalid_input");
  });

  test("rejects profane usernames and empty names", async ({ playwright }) => {
    const client = await newClient(playwright);
    const profane = await signup(client, { username: "puta_madre" });
    expect(profane.status()).toBe(400);
    expect((await profane.json()).error).toBe("inappropriate_content");

    const empty = await signup(client, { username: uniqueUsername(), displayName: "   " });
    expect(empty.status()).toBe(400);
    expect((await empty.json()).error).toBe("name_required");
  });

  test("duplicate usernames get username_taken", async ({ playwright }) => {
    const username = uniqueUsername("dup");
    expect((await signup(await newClient(playwright), { username })).status()).toBe(201);
    const again = await signup(await newClient(playwright), { username });
    expect(again.status()).toBe(409);
    expect((await again.json()).error).toBe("username_taken");
  });

  test("on a shared device, only unowned prayers are adopted", async ({ playwright }) => {
    const visitor = crypto.randomUUID();

    // Person A has an account; one of their prayers carries this device's cookie.
    const a = await newClient(playwright);
    const aRes = await signup(a, { username: uniqueUsername("a") });
    const aId = (await aRes.json()).user.id as string;
    const ownedByA = await insertPrayer({ visitorId: visitor, userId: aId });
    const unowned = await insertPrayer({ visitorId: visitor, userId: null });

    // Person B signs up on the same device (same visitor cookie).
    const b = await newClient(playwright, { cookie: `praywall_visitor=${visitor}` });
    const bRes = await signup(b, { username: uniqueUsername("b") });
    const bId = (await bRes.json()).user.id as string;

    const { rows } = await testDb().query<{ id: string; user_id: string | null }>(
      "SELECT id, user_id FROM prayers WHERE id = ANY($1)",
      [[ownedByA, unowned]]
    );
    const owner = Object.fromEntries(rows.map((r) => [r.id, r.user_id]));
    expect(owner[ownedByA]).toBe(aId);
    expect(owner[unowned]).toBe(bId);
  });
});

test.describe("login", () => {
  test("logs in without exposing the token; wrong password is generic", async ({ playwright }) => {
    const username = uniqueUsername("log");
    await signup(await newClient(playwright), { username });

    const client = await newClient(playwright);
    const ok = await login(client, username);
    expect(ok.status()).toBe(200);
    const body = await ok.json();
    expect(body).not.toHaveProperty("token");
    expect(body.user.username).toBe(username);

    const bad = await login(await newClient(playwright), username, "wrong-password");
    expect(bad.status()).toBe(401);
    expect((await bad.json()).error).toBe("invalid_credentials");
  });

  test("locks a username after 5 attempts, even across IPs", async ({ playwright }) => {
    const username = uniqueUsername("brute");
    await signup(await newClient(playwright), { username });
    for (let i = 0; i < 5; i++) {
      const res = await login(await newClient(playwright), username, `nope-${i}`);
      expect(res.status()).toBe(401);
    }
    const sixth = await login(await newClient(playwright), username, "password123");
    expect(sixth.status()).toBe(429);
    expect(sixth.headers()["retry-after"]).toBeTruthy();
  });

  test("limits attempts per IP", async ({ playwright }) => {
    const client = await newClient(playwright, { ip: uniqueIp() });
    for (let i = 0; i < 20; i++) {
      expect((await login(client, uniqueUsername("x"), "whatever")).status()).toBe(401);
    }
    expect((await login(client, uniqueUsername("x"), "whatever")).status()).toBe(429);
  });
});

test.describe("request hardening", () => {
  test("rejects non-JSON bodies (form CSRF) with 415", async ({ playwright }) => {
    const client = await newClient(playwright);
    const res = await client.post("/api/auth/login", {
      headers: { "content-type": "text/plain" },
      data: JSON.stringify({ username: "a", password: "b" }),
    });
    expect(res.status()).toBe(415);
  });

  test("rejects foreign origins with 403", async ({ playwright }) => {
    const client = await newClient(playwright);
    const res = await client.post("/api/auth/login", {
      data: { username: "a", password: "b" },
      headers: { origin: "https://evil.test" },
    });
    expect(res.status()).toBe(403);
  });

  test("rejects bodies over 16 KB with 413", async ({ playwright }) => {
    const client = await newClient(playwright);
    const res = await client.post("/api/auth/login", {
      data: { username: "a", password: "x".repeat(20_000) },
    });
    expect(res.status()).toBe(413);
  });

  test("malformed JSON is a 400, not a 500", async ({ playwright }) => {
    const client = await newClient(playwright);
    const res = await client.post("/api/auth/login", {
      headers: { "content-type": "application/json" },
      data: "{not json",
    });
    expect(res.status()).toBe(400);
  });
});

test.describe("sign-out", () => {
  test("works from the second trusted domain and clears the visitor cookie", async ({ playwright }) => {
    const client = await newClient(playwright, {
      cookie: `praywall_visitor=${crypto.randomUUID()}`,
    });
    await signup(client, { username: uniqueUsername("out") });

    const res = await client.post("/api/auth/sign-out", {
      headers: { origin: "https://unosporotros.test" },
      data: {},
    });
    expect(res.status()).toBe(200);
    expect(setCookieHeaders(res).some((c) => /^praywall_visitor=;.*Max-Age=0/i.test(c))).toBe(true);

    const session = await (await client.get("/api/auth/session")).json();
    expect(session.user).toBeNull();
  });

  test("an untrusted origin cannot sign the user out", async ({ playwright }) => {
    const client = await newClient(playwright);
    await signup(client, { username: uniqueUsername("keep") });
    const res = await client.post("/api/auth/sign-out", {
      headers: { origin: "https://evil.test" },
      data: {},
    });
    expect(res.status()).toBe(403);
    const session = await (await client.get("/api/auth/session")).json();
    expect(session.user).not.toBeNull();
  });
});

test("delete-user archives prayers and clears the visitor cookie", async ({ playwright }) => {
  const client = await newClient(playwright);
  const res = await signup(client, { username: uniqueUsername("del") });
  const userId = (await res.json()).user.id as string;
  const prayerId = await insertPrayer({ userId, displayName: "Ana", isAnonymous: false });

  const wrong = await client.post("/api/auth/delete-user", {
    data: { password: "wrong-password" },
    headers: { origin: BASE_URL },
  });
  expect(wrong.ok()).toBe(false);

  const del = await client.post("/api/auth/delete-user", {
    data: { password: "password123" },
    headers: { origin: BASE_URL },
  });
  expect(del.status()).toBe(200);
  expect(setCookieHeaders(del).some((c) => c.startsWith("praywall_visitor=;"))).toBe(true);

  const { rows } = await testDb().query(
    "SELECT user_id, display_name, archived_at FROM prayers WHERE id = $1",
    [prayerId]
  );
  expect(rows[0].user_id).toBeNull();
  expect(rows[0].display_name).toBeNull();
  expect(rows[0].archived_at).not.toBeNull();
});

test.describe("native endpoint hardening", () => {
  test("delete-user always needs the password, even with a fresh session", async ({ playwright }) => {
    const client = await newClient(playwright);
    await signup(client, { username: uniqueUsername("keepme") });
    for (const data of [{}, { password: "" }]) {
      const res = await client.post("/api/auth/delete-user", { data, headers: { origin: BASE_URL } });
      expect(res.status()).toBe(400);
    }
    const session = await (await client.get("/api/auth/session")).json();
    expect(session.user).not.toBeNull();
  });

  test("oversized bodies to native endpoints are rejected before Better-Auth reads them", async ({ playwright }) => {
    const client = await newClient(playwright);
    const res = await client.post("/api/auth/sign-out", {
      data: { pad: "x".repeat(20_000) },
      headers: { origin: BASE_URL },
    });
    expect(res.status()).toBe(413);
  });
});
