import { test, expect } from "@playwright/test";

test.describe("MovieSeat Lab booking", () => {
  test("full booking flow", async ({ page }) => {
    await page.goto("http://localhost:3003");
    await page.getByTestId("movie-city-confirm").click();
    await expect(page.getByTestId("movie-card").first()).toBeVisible();

    await page.getByTestId("movie-search-input").fill("Neon");
    await page.getByTestId("movie-view-details").first().click();
    await expect(page.getByTestId("movie-detail")).toBeVisible();

    await page.getByTestId("movie-show-date").first().click();
    await page.getByTestId("movie-select-cinema").first().click();
    await page.getByTestId("movie-showtime").first().click();
    await page.getByTestId("movie-continue-to-seats").click();

    await page.getByTestId("movie-ticket-count").selectOption("2");

    const seats = page.getByTestId("movie-seat-available");
    await seats.nth(0).click();
    await seats.nth(1).click();

    await expect(page.getByTestId("movie-continue-to-review")).toBeEnabled();
    await page.getByTestId("movie-continue-to-review").click();

    await expect(page.getByText("Booking Review")).toBeVisible();
    await page.getByRole("button", { name: "Continue to Payment" }).click();

    await page.getByRole("button", { name: "Simulate Payment" }).click();
    await expect(page).toHaveURL(/confirmation/);
    await expect(page.getByText("Booking Confirmed")).toBeVisible();
  });
});
