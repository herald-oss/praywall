import { Pool } from "pg";

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://praywall:praywall_dev@localhost:5432/praywall_test";

let pool: Pool | null = null;

export function testDb(): Pool {
  pool ??= new Pool({ connectionString: TEST_DATABASE_URL, max: 2 });
  return pool;
}

export async function resetDb(): Promise<void> {
  await testDb().query(
    'TRUNCATE intercessions, prayers, session, account, verification, "user" RESTART IDENTITY CASCADE'
  );
}

export async function closeDb(): Promise<void> {
  await pool?.end();
  pool = null;
}

export async function insertPrayer(values: {
  text?: string;
  displayName?: string | null;
  isAnonymous?: boolean;
  category?: string;
  intercessorCount?: number;
  visitorId?: string | null;
  userId?: string | null;
}): Promise<string> {
  const { rows } = await testDb().query<{ id: string }>(
    `INSERT INTO prayers (text, display_name, is_anonymous, category, intercessor_count, visitor_id, user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [
      values.text ?? "Oren por mi familia, por favor",
      values.displayName ?? null,
      values.isAnonymous ?? true,
      values.category ?? "general",
      values.intercessorCount ?? 0,
      values.visitorId ?? null,
      values.userId ?? null,
    ]
  );
  return rows[0].id;
}
