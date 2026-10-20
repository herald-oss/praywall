import { expect, test } from "@playwright/test";
import { closeDb, resetDb, testDb } from "../helpers/db";
import { BASE_URL, login, newClient, signup, uniqueUsername } from "../helpers/api";

test.beforeAll(resetDb);
test.afterAll(closeDb);

test.describe("PATCH /api/account/profile", () => {
  test("requires a session", async ({ playwright }) => {
    const res = await (await newClient(playwright)).patch("/api/account/profile", {
      data: { displayName: "Ana" },
      headers: { origin: BASE_URL },
    });
    expect(res.status()).toBe(401);
  });

  test("moderates the new name", async ({ playwright }) => {
    const client = await newClient(playwright);
    await signup(client, { username: uniqueUsername("mod") });
    for (const [displayName, code] of [["puta", "inappropriate_content"], ["   ", "name_required"]]) {
      const res = await client.patch("/api/account/profile", {
        data: { displayName },
        headers: { origin: BASE_URL },
      });
      expect(res.status()).toBe(400);
      expect((await res.json()).error).toBe(code);
    }
  });

  test("updates the session and the account's signed prayers, not anonymous ones", async ({ playwright }) => {
    const client = await newClient(playwright);
    await signup(client, { username: uniqueUsername("ren"), displayName: "Pedro" });
    const post = (isAnonymous: boolean) =>
      client.post("/api/prayers", {
        data: { text: `Oren por mi familia ${isAnonymous}`, isAnonymous },
        headers: { origin: BASE_URL },
      });
    const signed = (await (await post(false)).json()).id;
    const anon = (await (await post(true)).json()).id;

    const res = await client.patch("/api/account/profile", {
      data: { displayName: "Pedro J." },
      headers: { origin: BASE_URL },
    });
    expect(res.status()).toBe(200);

    const session = await (await client.get("/api/auth/session")).json();
    expect(session.user.name).toBe("Pedro J.");

    const { rows } = await testDb().query<{ id: string; display_name: string | null }>(
      "SELECT id, display_name FROM prayers WHERE id = ANY($1)",
      [[signed, anon]]
    );
    const names = Object.fromEntries(rows.map((r) => [r.id, r.display_name]));
    expect(names[signed]).toBe("Pedro J.");
    expect(names[anon]).toBeNull();
  });
});

test.describe("change password", () => {
  test("rejects a wrong current password", async ({ playwright }) => {
    const client = await newClient(playwright);
    await signup(client, { username: uniqueUsername("pw") });
    const res = await client.post("/api/auth/change-password", {
      data: { currentPassword: "not-it-123", newPassword: "newpassword1", revokeOtherSessions: true },
      headers: { origin: BASE_URL },
    });
    expect(res.ok()).toBe(false);
    expect((await res.json()).code).toBe("INVALID_PASSWORD");
  });

  test("changes it and signs out other devices", async ({ playwright }) => {
    const username = uniqueUsername("chg");
    const phone = await newClient(playwright);
    await signup(phone, { username });
    const laptop = await newClient(playwright);
    await login(laptop, username);

    const res = await phone.post("/api/auth/change-password", {
      data: { currentPassword: "password123", newPassword: "brand-new-pass", revokeOtherSessions: true },
      headers: { origin: BASE_URL },
    });
    expect(res.status()).toBe(200);

    // The cookie cache can keep a revoked session alive for up to 5 minutes
    // on the other device; the database session itself must be gone.
    const { rows } = await testDb().query(
      `SELECT count(*)::int AS n FROM session s JOIN "user" u ON u.id = s.user_id WHERE u.username = $1`,
      [username]
    );
    expect(rows[0].n).toBe(1);

    expect((await login(await newClient(playwright), username, "password123")).status()).toBe(401);
    expect((await login(await newClient(playwright), username, "brand-new-pass")).status()).toBe(200);
  });
});
