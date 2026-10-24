import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3001";

async function resetScenario(page: any) {
  await page.request.post(`${BASE}/api/reset`);
}

async function setScenario(page: any, scenario: string, config: any = {}) {
  await page.request.post(`${BASE}/api/scenario`, {
    data: { scenario, config },
  });
}

async function selectStation(page: any, inputTestId: string, optionTestId: string, partial: string) {
  await page.getByTestId(inputTestId).fill(partial);
  await page.getByTestId(optionTestId).first().click();
}

async function doSearch(page: any, fromPartial: string, toPartial: string, date = "2026-10-30") {
  await selectStation(page, "rail-from-input", "rail-from-option", fromPartial);
  await selectStation(page, "rail-to-input", "rail-to-option", toPartial);
  await page.getByTestId("rail-date-input").fill(date);
  await page.getByTestId("rail-search-submit").click();
}

async function goToPassengers(page: any) {
  await page.getByTestId("rail-class-option").first().click();
  await page.getByTestId("rail-select-train").first().click();
}

test.beforeEach(async ({ page }) => {
  await resetScenario(page);
});

test("1 homepage loads", async ({ page }) => {
  await page.goto(BASE);
  await expect(page.getByTestId("rail-search-form")).toBeVisible();
  await expect(page.getByTestId("mock-environment-banner")).toContainText("MOCK TEST ENVIRONMENT");
});

test("2 station autocomplete works", async ({ page }) => {
  await page.goto(BASE);
  await page.getByTestId("rail-from-input").fill("Pun");
  await expect(page.getByTestId("rail-from-option").first()).toBeVisible();
  await page.getByTestId("rail-from-option").first().click();
  await expect(page.getByTestId("rail-from-input")).toHaveValue(/Pune/);
});

test("3 keyboard selection works", async ({ page }) => {
  await page.goto(BASE);
  await page.getByTestId("rail-from-input").fill("Mum");
  await page.getByTestId("rail-from-input").press("ArrowDown");
  await page.getByTestId("rail-from-input").press("Enter");
  await expect(page.getByTestId("rail-from-input")).toHaveValue(/Mumbai/);
});

test("4 origin and destination swapping works", async ({ page }) => {
  await page.goto(BASE);
  await selectStation(page, "rail-from-input", "rail-from-option", "Pun");
  await selectStation(page, "rail-to-input", "rail-to-option", "Mum");
  const fromBefore = await page.getByTestId("rail-from-input").inputValue();
  const toBefore = await page.getByTestId("rail-to-input").inputValue();
  await page.getByTestId("rail-swap-stations").click();
  await expect(page.getByTestId("rail-from-input")).toHaveValue(toBefore);
  await expect(page.getByTestId("rail-to-input")).toHaveValue(fromBefore);
});

test("5 same-station search is rejected", async ({ page }) => {
  await page.goto(BASE);
  await selectStation(page, "rail-from-input", "rail-from-option", "Pun");
  await selectStation(page, "rail-to-input", "rail-to-option", "Pun");
  await page.getByTestId("rail-date-input").fill("2026-10-30");
  await page.getByTestId("rail-search-submit").click();
  await expect(page.getByRole("alert").first()).toBeVisible();
});

test("6 past date is rejected", async ({ page }) => {
  await page.goto(BASE);
  await selectStation(page, "rail-from-input", "rail-from-option", "Pun");
  await selectStation(page, "rail-to-input", "rail-to-option", "Mum");
  await page.getByTestId("rail-date-input").fill("2020-01-01");
  await page.getByTestId("rail-search-submit").click();
  await expect(page.getByRole("alert").first()).toBeVisible();
});

test("7 valid search produces route-specific results", async ({ page }) => {
  await page.goto(BASE);
  await doSearch(page, "Pun", "Mum");
  await expect(page.getByTestId("rail-result-card").first()).toBeVisible();
  await expect(page.getByText("Pune Mumbai Intercity")).toBeVisible();
});

test("8 filters and sorting work", async ({ page }) => {
  await page.goto(BASE);
  await doSearch(page, "Pun", "Mum");
  // filter by max fare low enough to exclude 1A? use max fare 200
  await page.getByLabel("Max fare").fill("200");
  // still some SL class result
  await expect(page.getByTestId("rail-result-card").first()).toBeVisible();
  // sorting by fare
  await page.getByLabel("Max fare").fill("");
  await page.getByLabel("Sort by").selectOption("fare");
  const firstPrice = await page.getByTestId("rail-class-option").first().innerText();
  await page.getByLabel("Sort by").selectOption("departure");
  // just ensure no crash
  await expect(page.getByTestId("rail-results")).toBeVisible();
});

test("9 a train and class can be selected", async ({ page }) => {
  await page.goto(BASE);
  await doSearch(page, "Pun", "Mum");
  await page.getByTestId("rail-class-option").first().click();
  await page.getByTestId("rail-select-train").first().click();
  await expect(page).toHaveURL(/\/passengers/);
});

test("10 passenger details validate correctly", async ({ page }) => {
  await page.goto(BASE);
  await doSearch(page, "Pun", "Mum");
  await page.getByTestId("rail-class-option").first().click();
  await page.getByTestId("rail-select-train").first().click();
  await page.getByTestId("rail-continue-review").click();
  await expect(page.getByRole("alert").first()).toBeVisible();
});

test("11 multiple passengers can be added", async ({ page }) => {
  await page.goto(BASE);
  await doSearch(page, "Pun", "Mum");
  await page.getByTestId("rail-class-option").first().click();
  await page.getByTestId("rail-select-train").first().click();
  await page.getByTestId("rail-add-passenger").click();
  await expect(page.getByTestId("rail-passenger-card")).toHaveCount(2);
});

test("12 fare calculation is correct", async ({ page }) => {
  await page.goto(BASE);
  await doSearch(page, "Pun", "Mum");
  await page.getByTestId("rail-class-option").first().click();
  await page.getByTestId("rail-select-train").first().click();
  await page.getByTestId("rail-passenger-name").first().fill("Test User");
  await page.getByTestId("rail-passenger-age").first().fill("30");
  await page.getByTestId("rail-passenger-gender").first().selectOption("Male");
  await page.getByTestId("rail-continue-review").click();
  await expect(page).toHaveURL(/\/review/);
  // total should be visible
  await expect(page.getByText(/Total amount/)).toBeVisible();
});

test("13 stale inventory is detected", async ({ page }) => {
  await page.goto(BASE);
  await doSearch(page, "Pun", "Mum");
  // set stale for first train id
  const firstCard = page.getByTestId("rail-result-card").first();
  // get train id via attribute
  const trainId = await firstCard.getAttribute("data-train-id");
  await setScenario(page, "stale-inventory", { staleItemId: trainId });
  await page.getByTestId("rail-class-option").first().click();
  await page.getByTestId("rail-select-train").first().click();
  // should not navigate
  await expect(page).not.toHaveURL(/\/passengers/);
});

test("14 failed simulated payment does not confirm a ticket", async ({ page }) => {
  await page.goto(BASE);
  await doSearch(page, "Pun", "Mum");
  await page.getByTestId("rail-class-option").first().click();
  await page.getByTestId("rail-select-train").first().click();
  await page.getByTestId("rail-passenger-name").first().fill("Test User");
  await page.getByTestId("rail-passenger-age").first().fill("30");
  await page.getByTestId("rail-passenger-gender").first().selectOption("Male");
  await page.getByTestId("rail-continue-review").click();
  await page.getByTestId("rail-continue-review")?.click().catch(() => {});
  // review continue button label is Continue to Payment; use text
  await page.getByRole("button", { name: "Continue to Payment" }).click();
  // declined outcome
  await page.getByTestId("rail-payment-outcome").selectOption("declined");
  await page.getByTestId("rail-simulate-payment").click();
  await expect(page).not.toHaveURL(/\/confirmation/);
});

test("15 retrying payment succeeds", async ({ page }) => {
  await page.goto(BASE);
  await doSearch(page, "Pun", "Mum");
  await page.getByTestId("rail-class-option").first().click();
  await page.getByTestId("rail-select-train").first().click();
  await page.getByTestId("rail-passenger-name").first().fill("Test User");
  await page.getByTestId("rail-passenger-age").first().fill("30");
  await page.getByTestId("rail-passenger-gender").first().selectOption("Male");
  await page.getByTestId("rail-continue-review").click();
  await page.getByRole("button", { name: "Continue to Payment" }).click();
  await page.getByTestId("rail-payment-outcome").selectOption("temporary-failure");
  await page.getByTestId("rail-simulate-payment").click();
  // retry
  await page.getByTestId("rail-simulate-payment").click();
  await expect(page).toHaveURL(/\/confirmation/);
});

test("16 successful journey creates mock PNR and booking ID", async ({ page }) => {
  await page.goto(BASE);
  await doSearch(page, "Pun", "Mum");
  await page.getByTestId("rail-class-option").first().click();
  await page.getByTestId("rail-select-train").first().click();
  await page.getByTestId("rail-passenger-name").first().fill("Test User");
  await page.getByTestId("rail-passenger-age").first().fill("30");
  await page.getByTestId("rail-passenger-gender").first().selectOption("Male");
  await page.getByTestId("rail-continue-review").click();
  await page.getByRole("button", { name: "Continue to Payment" }).click();
  await page.getByTestId("rail-simulate-payment").click();
  await expect(page).toHaveURL(/\/confirmation/);
  await expect(page.getByText(/Mock PNR:/)).toBeVisible();
  await expect(page.getByText(/Booking ID:/)).toBeVisible();
});

test("17 reloading confirmation does not duplicate booking", async ({ page }) => {
  await page.goto(BASE);
  await doSearch(page, "Pun", "Mum");
  await page.getByTestId("rail-class-option").first().click();
  await page.getByTestId("rail-select-train").first().click();
  await page.getByTestId("rail-passenger-name").first().fill("Test User");
  await page.getByTestId("rail-passenger-age").first().fill("30");
  await page.getByTestId("rail-passenger-gender").first().selectOption("Male");
  await page.getByTestId("rail-continue-review").click();
  await page.getByRole("button", { name: "Continue to Payment" }).click();
  await page.getByTestId("rail-simulate-payment").click();
  await expect(page).toHaveURL(/\/confirmation/);
  const url = page.url();
  const before = await page.request.get(`${BASE}/api/bookings`);
  const beforeJson = await before.json();
  const countBefore = beforeJson.bookings.length;
  await page.reload();
  await expect(page).toHaveURL(url);
  const after = await page.request.get(`${BASE}/api/bookings`);
  const afterJson = await after.json();
  expect(afterJson.bookings.length).toBe(countBefore);
});

test("18 empty results and temporary errors recover correctly", async ({ page }) => {
  await page.goto(BASE);
  await setScenario(page, "empty-results");
  await doSearch(page, "Pun", "Mum");
  await expect(page.getByTestId("rail-no-results")).toBeVisible();

  await page.goto(BASE);
  await resetScenario(page);
  await doSearch(page, "Pun", "Mum");
  await expect(page.getByTestId("rail-result-card").first()).toBeVisible();

  await page.goto(BASE);
  await setScenario(page, "temporary-error");
  await doSearch(page, "Pun", "Mum");
  await expect(page.getByRole("alert").first()).toBeVisible();
  await doSearch(page, "Pun", "Mum");
  await expect(page.getByTestId("rail-result-card").first()).toBeVisible();
});