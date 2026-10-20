import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// One explicit, small pool per process, kept on globalThis so dev reloads
// don't leak a new pool (and new connections) on every edit. Each Postgres
// connection also costs memory on the database side, so keep it modest.
const g = globalThis as unknown as {
  __praywallPool?: Pool;
  __praywallDb?: NodePgDatabase<typeof schema>;
};

function envInt(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const pool = (g.__praywallPool ??= new Pool({
  connectionString: process.env.DATABASE_URL,
  max: envInt("DB_POOL_MAX", 5),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
}));

export const db = (g.__praywallDb ??= drizzle(pool, { schema }));
