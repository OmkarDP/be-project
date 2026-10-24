import { test, expect } from "@playwright/test";
import {
  REDBUS_BASE,
  installStoreProbe,
  mockRedbusApi,
  searchLucknowToFaizabad,
} from "../../playwright/helpers/redbus";

test.describe("RedBus mock smoke", () => {
  test.beforeEach(async ({ page }) => {
    await installStoreProbe(page);
    await mockRedbusApi(page);
  });

  test("homepage loads and a valid search reaches bus results", async ({
    page,
  }) => {
    await page.goto(REDBUS_BASE);
    await expect(
      page.getByRole("button", { name: "Search Bus" }),
    ).toBeVisible();

    await searchLucknowToFaizabad(page, "2026-11-15");
    await expect(page).toHaveURL(/\/select-bus\?/);
    await expect(page.getByText("Sunrise Express")).toBeVisible();
  });

  test("unsupported route shows the served-routes modal", async ({ page }) => {
    await page.goto(REDBUS_BASE);
    await expect(
      page.getByRole("button", { name: "Search Bus" }),
    ).toBeVisible();

    // Delhi -> Faizabad is not in the app's hard-coded route whitelist
    await page.getByPlaceholder("Source").fill("Delhi");
    await page.getByPlaceholder("Destination").fill("Faizabad");
    await page.locator('input[type="date"]').fill("2026-11-15");
    await page.getByRole("button", { name: "Search Bus" }).click();

    await expect(
      page.getByText(/Currently we are serving our customers only/i),
    ).toBeVisible();
  });
});
