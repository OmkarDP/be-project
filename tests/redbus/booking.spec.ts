import { test, expect } from "@playwright/test";
import {
  REDBUS_BASE,
  installStoreProbe,
  loginAsDemoCustomer,
  mockRedbusApi,
  searchLucknowToFaizabad,
} from "../../playwright/helpers/redbus";

const SEARCH_DATE = "2026-11-15";

test.describe("RedBus mock — booking flow up to payment", () => {
  test.beforeEach(async ({ page }) => {
    await installStoreProbe(page);
    await mockRedbusApi(page);
  });

  test("search → seats → boarding/drop → passengers → payment page", async ({
    page,
  }) => {
    const routesLoaded = page.waitForResponse(
      (response) => new URL(response.url()).pathname === "/v1/api/routes",
    );

    await page.goto(REDBUS_BASE);
    await routesLoaded;
    await loginAsDemoCustomer(page);

    // 1. Search buses from the home page
    await searchLucknowToFaizabad(page, SEARCH_DATE);
    await expect(page).toHaveURL(/\/select-bus\?/);
    await expect(page.getByText("Sunrise Express")).toBeVisible();

    // 2. Open the seat map of the first bus
    await page.getByText("VIEW SEATS").first().click();
    const seats = page.locator('[class*="SmallSeat"]');
    await expect(seats).toHaveCount(40);

    // 3. Pick the first available seat (1-3 are mocked as booked)
    await seats.nth(3).locator("svg").click();
    await expect(page.getByText("BOARDING POINT")).toBeVisible();

    // 4. Choose boarding and dropping points
    await page.locator('input[name="board-address"]').first().check();
    await page.getByText("DROPPING POINT").click();
    await page.locator('input[name="dest-address"]').first().check();
    await page.getByRole("button", { name: "Continue" }).click();

    // 5. Open the passenger form
    await expect(page.getByText("Boarding and Dropping")).toBeVisible();
    await page.getByRole("button", { name: "Proceed To Book" }).click();
    await expect(page.getByText("Enter Passenger Details")).toBeVisible();

    await page.getByPlaceholder("Name").fill("Playwright User");
    await page.locator('input[name="gender0"][value="Male"]').check();
    await page.getByPlaceholder("Age").fill("30");
    await page.getByPlaceholder("Email").fill("pw@example.com");
    await page.getByPlaceholder("Phone").fill("9876543210");

    // 6. Proceed to payment — stop before actually paying
    await page.getByRole("button", { name: /proceed to pay/i }).click();
    await expect(page).toHaveURL(/\/payment-page/);
    await expect(page.getByText("Total Payable")).toBeVisible();
    await expect(page.getByPlaceholder("ENTER OFFER CODE")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Pay With Stripe" }),
    ).toBeVisible();
  });
});
