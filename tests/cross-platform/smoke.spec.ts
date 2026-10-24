import { test, expect } from "@playwright/test";

test.describe("Cross-platform mock environment", () => {
  test("all three mock apps are reachable", async ({ request }) => {
    // The RedBus mock (cloned CRA app) has no /api/health endpoint, so only
    // check that its dev server serves the app shell.
    const checks = [
      { url: "http://localhost:3001/api/health" },
      { url: "http://localhost:3002" },
      { url: "http://localhost:3003/api/health" },
    ];

    for (const { url } of checks) {
      const res = await request.get(url);
      expect(res.ok(), `expected ${url} to respond OK`).toBeTruthy();
    }
  });
});
