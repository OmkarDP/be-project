import { test, expect } from "@playwright/test";

test.describe("BookMyShow mock smoke", () => {
  test("opens app, warns, browses movies, validates, resets", async ({ page }) => {
    await page.goto("http://localhost:3003");
    await expect(page.getByTestId("mock-environment-banner")).toContainText("MOCK TEST ENVIRONMENT");
    await expect(page.getByTestId("movie-city-selector")).toBeVisible();

    // valid browse
    await page.getByTestId("movie-city-confirm").click();
    await expect(page.getByTestId("movie-card").first()).toBeVisible();

    // invalid city
    await page.getByTestId("movie-city-input").fill("");
    await page.getByTestId("movie-city-confirm").click();
    await expect(page.getByRole("alert").first()).toBeVisible();

    // empty-results scenario then reset restores
    await page.getByTestId("movie-city-input").fill("Pune");
    await page.getByTestId("scenario-select").selectOption("empty-results");
    await page.getByTestId("movie-city-confirm").click();
    await expect(page.getByTestId("no-movies")).toBeVisible();

    await page.getByTestId("scenario-reset-button").click();
    await page.getByTestId("movie-city-confirm").click();
    await expect(page.getByTestId("movie-card").first()).toBeVisible();
  });
});