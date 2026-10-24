import { defineConfig, devices } from "@playwright/test";

/**
 * Focused config for the RedBus clone only.
 * Use when iterating on the RedBus flow: `npx playwright test -c playwright.redbus.config.ts`
 */
export default defineConfig({
  testDir: "./tests/redbus",
  timeout: 90000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "npm --prefix apps/mock-redbus/front-end-redbus start",
      url: "http://localhost:3002",
      reuseExistingServer: true,
      timeout: 180000,
      env: {
        PORT: "3002",
        BROWSER: "none",
        NODE_OPTIONS: "--openssl-legacy-provider",
        SKIP_PREFLIGHT_CHECK: "true",
        REACT_APP_BACKEND_URL: "http://localhost:3002",
      },
    },
  ],
});
