import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for Next.js E2E tests.
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./e2e",
  // Every personal route needs a session, and sessions need the Compose stack.
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],

  webServer: {
    // CI serves the production build (`E2E_SERVER_COMMAND="pnpm start"`).
    command: process.env.E2E_SERVER_COMMAND ?? "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Without this the suite hangs at teardown until the job is killed. The
    // command runs through pnpm, so Playwright's stop signal reaches pnpm and
    // not the `next-server` it spawned; Playwright then waits for a port that
    // nobody is going to release. Measured on CI: every shard finished its
    // tests in about four minutes and then sat silent for forty-one, until the
    // runner terminated `next-server` as an orphan process. That silence, not
    // the suite's length, is what had been exhausting the job's time limit.
    gracefulShutdown: { signal: "SIGTERM", timeout: 10_000 },
    stdout: "ignore",
    stderr: "pipe",
  },
});
