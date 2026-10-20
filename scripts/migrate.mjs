// Production migration runner (Railway "Pre-deploy command").
// Uses drizzle-orm's migrator, a production dependency, so the deployed
// image doesn't need drizzle-kit (a dev dependency) at all. It reads the
// same migrations/ folder and the same drizzle.__drizzle_migrations table
// as `npm run db:migrate`, so both can be used interchangeably.
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { fileURLToPath } from "node:url";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
try {
  await migrate(drizzle(pool), {
    migrationsFolder: fileURLToPath(new URL("../migrations", import.meta.url)),
  });
  console.log("Migrations applied.");
} catch (error) {
  console.error("Migration failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
