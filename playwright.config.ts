import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60000,
  expect: { timeout: 10000 },
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
      command: "pnpm dev:irctc",
      url: "http://localhost:3001/api/health",
      reuseExistingServer: true,
      timeout: 180000,
    },
    {
      // The RedBus mock is the cloned CRA app in apps/mock-redbus.
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
    {
      command: "pnpm dev:bookmyshow",
      url: "http://localhost:3003/api/health",
      reuseExistingServer: true,
      timeout: 180000,
    },
  ],
});