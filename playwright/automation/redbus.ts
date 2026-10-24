import path from "node:path";
import os from "node:os";
import { chromium, BrowserContext, Page } from "@playwright/test";
import {
  REDBUS_BASE,
  installStoreProbe,
  loginAsDemoCustomer,
  mockRedbusApi,
} from "../helpers/redbus.js";
import { installVirtualCursor, humanClick, humanType } from "../helpers/virtualCursor.js";

export interface RedBusParams {
  source?: string;
  destination?: string;
  travelDate?: string;
  passengerName?: string;
  gender?: "Male" | "Female";
  age?: number | string;
  email?: string;
  phone?: string;
  headless?: boolean;
}

export type LogCallback = (msg: string, level?: "info" | "success" | "warn" | "error") => void;

export async function runRedBusAutomation(
  params: RedBusParams,
  onLog: LogCallback = () => {}
) {
  const source = params.source?.trim() || "Lucknow";
  const destination = params.destination?.trim() || "Faizabad";
  const travelDate = params.travelDate || "2026-11-15";
  const passengerName = params.passengerName?.trim() || "Playwright User";
  const gender = params.gender || "Male";
  const age = String(params.age || "30");
  const email = params.email?.trim() || "pw@example.com";
  const phone = params.phone?.trim() || "9876543210";
  const headless = params.headless !== undefined ? params.headless : false;

  onLog(`🚀 Launching browser window (headless: ${headless})...`, "info");
  const userDataDir = path.join(os.tmpdir(), "pw_redbus_profile_" + Date.now());

  const context: BrowserContext = await chromium.launchPersistentContext(userDataDir, {
    channel: "chrome",
    headless,
    viewport: null,
    args: [
      "--start-maximized",
      "--window-position=40,40",
      "--no-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const page: Page = context.pages()[0] || (await context.newPage());
  await installVirtualCursor(page);

  try {
    onLog(`🔧 Setting up RedBus API mocks and Redux store probe...`, "info");
    await installStoreProbe(page);
    await mockRedbusApi(page);

    const routesLoaded = page
      .waitForResponse(
        (response) => new URL(response.url()).pathname === "/v1/api/routes",
        { timeout: 30000 }
      )
      .catch(() => null);

    onLog(`🌐 Opening RedBus web app at ${REDBUS_BASE}...`, "info");
    await page.goto(REDBUS_BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
    await routesLoaded;
    onLog(`✓ RedBus routes loaded successfully`, "success");

    onLog(`👤 Logging in as demo customer...`, "info");
    await loginAsDemoCustomer(page);
    onLog(`✓ Customer session initialized`, "success");

    onLog(`🖱️ Virtual mouse: Entering source "${source}"...`, "info");
    const sourceInput = page.getByPlaceholder("Source");
    await humanType(page, sourceInput, source, 70);

    const depItem = page
      .locator('[class*="LandingPage__form__departure__dropdown"] li')
      .filter({ hasText: source })
      .first();
    if (await depItem.isVisible()) {
      await humanClick(page, depItem, 400);
    }

    onLog(`🖱️ Virtual mouse: Entering destination "${destination}"...`, "info");
    const destInput = page.getByPlaceholder("Destination");
    await humanType(page, destInput, destination, 70);

    const arrItem = page
      .locator('[class*="LandingPage__form__arrival__dropdown"] li')
      .filter({ hasText: destination })
      .first();
    if (await arrItem.isVisible()) {
      await humanClick(page, arrItem, 400);
    }

    onLog(`📅 Setting journey date: ${travelDate}...`, "info");
    const dateInput = page.locator('input[type="date"]');
    await humanClick(page, dateInput, 200);
    await dateInput.fill(travelDate);

    onLog(`🔍 Clicking "Search Bus"...`, "info");
    await humanClick(page, page.getByRole("button", { name: "Search Bus" }), 800);

    await page.waitForURL(/\/select-bus\?/, { timeout: 15000 });
    await page.getByText("Sunrise Express").waitFor({ state: "visible", timeout: 15000 });
    onLog(`✓ Found "Sunrise Express"`, "success");

    onLog(`🪑 Clicking "VIEW SEATS"...`, "info");
    await humanClick(page, page.getByText("VIEW SEATS").first(), 800);
    const seats = page.locator('[class*="SmallSeat"]');
    await seats.first().waitFor({ state: "visible", timeout: 10000 });

    onLog(`🖱️ Virtual cursor: Clicking available seat...`, "info");
    // Seats 1-3 booked, pick seat 4 (index 3)
    await humanClick(page, seats.nth(3).locator("svg"), 800);

    await page.getByText("BOARDING POINT").waitFor({ state: "visible", timeout: 10000 });
    onLog(`📍 Selecting boarding point...`, "info");
    await humanClick(page, page.locator('input[name="board-address"]').first(), 400);

    onLog(`📍 Selecting dropping point...`, "info");
    await humanClick(page, page.getByText("DROPPING POINT"), 300);
    await humanClick(page, page.locator('input[name="dest-address"]').first(), 400);

    onLog(`Proceeding to passenger details...`, "info");
    await humanClick(page, page.getByRole("button", { name: "Continue" }), 600);

    await page.getByText("Boarding and Dropping").waitFor({ state: "visible", timeout: 10000 });
    await humanClick(page, page.getByRole("button", { name: "Proceed To Book" }), 600);

    await page.getByText("Enter Passenger Details").waitFor({ state: "visible", timeout: 10000 });

    onLog(`📝 Virtual typing: Name "${passengerName}"...`, "info");
    await humanType(page, page.getByPlaceholder("Name"), passengerName, 60);

    onLog(`Gender: ${gender}...`, "info");
    await humanClick(page, page.locator(`input[name="gender0"][value="${gender}"]`), 300);

    onLog(`Age: ${age}...`, "info");
    await humanType(page, page.getByPlaceholder("Age"), age, 70);

    onLog(`Email: ${email}...`, "info");
    await humanType(page, page.getByPlaceholder("Email"), email, 50);

    onLog(`Phone: ${phone}...`, "info");
    await humanType(page, page.getByPlaceholder("Phone"), phone, 60);

    onLog(`💳 Virtual mouse: Clicking "Proceed to Pay"...`, "info");
    await humanClick(page, page.getByRole("button", { name: /proceed to pay/i }), 1000);

    await page.waitForURL(/\/payment-page/, { timeout: 15000 });
    await page.getByText("Total Payable").waitFor({ state: "visible", timeout: 15000 });

    onLog(`📱 Payment Page loaded with Dummy UPI QR Code!`, "info");
    onLog(`👉 Awaiting REAL USER action: Please scan QR or click "✅ Payment Successful" or "❌ Payment Failed" on screen!`, "warn");

    // Wait for real user action (up to 2 minutes)
    await page.waitForResponse(
      (response) => {
        const url = response.url();
        return url.includes("/v1/api/booking") && response.request().method() === "POST";
      },
      { timeout: 120000 }
    );

    onLog(`✓ User confirmed payment! Redirecting to My Trips / Profile...`, "success");
    await page.waitForURL(/\/my-profile/, { timeout: 15000 });

    onLog(`🎉 RedBus Booking Confirmed! Ticket and trip details are visible on your screen.`, "success");
    onLog(`📥 Window will remain open for you to view / inspect the booked ticket!`, "info");

    return {
      success: true,
      message: "RedBus booking completed! Ticket details are open on screen.",
    };
  } catch (err: any) {
    onLog(`❌ Error in RedBus automation: ${err.message}`, "error");
    throw err;
  } finally {
    if (!headless) {
      onLog(`🎟️ Keeping ticket window open for 120 seconds for user download & review...`, "info");
      await page.waitForTimeout(120000);
    } else {
      await page.waitForTimeout(2000);
    }
    await context.close();
  }
}
