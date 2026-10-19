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
      `npm run db:migrate && npm run build && npx next start -p ${PORT}`,
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
    },
  },
});
