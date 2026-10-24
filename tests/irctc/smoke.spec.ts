import { test, expect } from "@playwright/test";

test.describe("IRCTC mock smoke", () => {
  test("opens app, warns, searches, validates, resets", async ({ page }) => {
    await page.goto("http://localhost:3001");
    await expect(page.getByTestId("mock-environment-banner")).toContainText("MOCK TEST ENVIRONMENT");
    await expect(page.getByTestId("rail-search-form")).toBeVisible();

    await page.getByTestId("rail-search-submit").click();
    await expect(page.getByTestId("rail-result-card").first()).toBeVisible();

    await page.goto("http://localhost:3001");
    await page.getByTestId("rail-from-input").fill("");
    await page.getByTestId("rail-to-input").fill("");
    await page.getByTestId("rail-date-input").fill("");
    await page.getByTestId("rail-search-submit").click();
    await expect(page.getByRole("alert").first()).toBeVisible();

    await page.goto("http://localhost:3001");
    await page.getByTestId("rail-from-input").fill("Auro");
    await page.getByTestId("rail-from-option").first().click();
    await page.getByTestId("rail-to-input").fill("Bore");
    await page.getByTestId("rail-to-option").first().click();
    await page.getByTestId("rail-date-input").fill("2026-10-30");
    await page.getByTestId("scenario-select").selectOption("empty-results");
    await page.getByTestId("rail-search-submit").click();
    await expect(page.getByTestId("rail-no-results")).toBeVisible();

    await page.goto("http://localhost:3001");
    await page.getByTestId("scenario-reset-button").click();
    await page.getByTestId("rail-search-submit").click();
    await expect(page.getByTestId("rail-result-card").first()).toBeVisible();
  });
});
