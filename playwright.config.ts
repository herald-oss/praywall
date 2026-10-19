import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PW_PORT ?? 3100);
const baseURL = `http://localhost:${PORT}`;
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://praywall:praywall_dev@localhost:5432/praywall_test";

// Runs against a production build (`next start`) and a dedicated test
// database. Specs reset the tables they use, so they run serially.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { baseURL, trace: "retain-on-failure" },
  projects: [
    { name: "api", testDir: "./tests/api" },
    {
      name: "e2e",
      testDir: "./tests/e2e",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command:
      process.env.PW_SERVER_CMD ??
      // Same path as production: migrate with the prod runner, then the
      // standalone server.
      `node scripts/migrate.mjs && npm run build && node .next/standalone/server.js`,
    url: `${baseURL}/es`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    stdout: "pipe",
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      BETTER_AUTH_SECRET: "test-secret-0123456789abcdef0123456789abcdef",
      BETTER_AUTH_URL: baseURL,
      NEXT_PUBLIC_APP_URL: baseURL,
      PORT: String(PORT),
      HOSTNAME: "0.0.0.0",
      // A second production domain, to prove multi-domain origins work.
      BETTER_AUTH_TRUSTED_ORIGINS: "https://unosporotros.test",
      TRUSTED_IP_HEADER: "x-real-ip",
      // Short stream lifetime so E2E proves the client reconnects (production
      // default is 14 minutes), and fast count flushes.
      SSE_MAX_LIFETIME_MS: "8000",
      SSE_COUNT_FLUSH_MS: "300",
    },
  },
});
