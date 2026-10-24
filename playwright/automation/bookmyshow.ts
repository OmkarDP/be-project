import path from "node:path";
import os from "node:os";
import { chromium, BrowserContext, Page } from "@playwright/test";
import { URLS } from "../helpers/urls.js";
import { installVirtualCursor, humanClick, humanType } from "../helpers/virtualCursor.js";

export interface BookMyShowParams {
  city?: string;
  movieQuery?: string;
  ticketCount?: number;
  headless?: boolean;
}

export type LogCallback = (msg: string, level?: "info" | "success" | "warn" | "error") => void;

export async function runBookMyShowAutomation(
  params: BookMyShowParams,
  onLog: LogCallback = () => {}
) {
  const city = params.city?.trim() || "Pune";
  const movieQuery = params.movieQuery?.trim() || "Neon";
  const ticketCount = Math.max(1, Math.min(params.ticketCount || 2, 4));
  const headless = params.headless !== undefined ? params.headless : false;

  onLog(`🚀 Launching browser window (headless: ${headless})...`, "info");
  const userDataDir = path.join(os.tmpdir(), "pw_bms_profile_" + Date.now());

  const context: BrowserContext = await chromium.launchPersistentContext(userDataDir, {
    channel: "chrome",
    headless,
    viewport: null, // Allows full window maximization
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
    const targetUrl = URLS.bookmyshow || "http://localhost:3003";
    onLog(`🌐 Navigating to BookMyShow: ${targetUrl}...`, "info");
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(600);

    onLog(`🖱️ Virtual mouse: Moving to city selection...`, "info");
    const cityInput = page.getByTestId("movie-city-input");
    if (await cityInput.isVisible()) {
      await humanType(page, cityInput, city, 70);
      onLog(`📍 Confirming city: ${city}...`, "info");
      await humanClick(page, page.getByTestId("movie-city-confirm"), 600);
      onLog(`✓ City confirmed: ${city}`, "success");
    }

    onLog(`🖱️ Virtual mouse: Moving to movie search input...`, "info");
    const searchInput = page.getByTestId("movie-search-input");
    await humanType(page, searchInput, movieQuery, 80);

    const movieCards = page.getByTestId("movie-card");
    await movieCards.first().waitFor({ state: "visible", timeout: 10000 });
    const cardCount = await movieCards.count();
    onLog(`🎬 Found ${cardCount} movie(s). Clicking "View Details"...`, "info");

    const viewDetailsBtn = page.getByTestId("movie-view-details").first();
    await humanClick(page, viewDetailsBtn, 800);
    await page.getByTestId("movie-detail").waitFor({ state: "visible", timeout: 10000 });
    onLog(`✓ Movie details loaded`, "success");

    // Select show date & cinema
    const showDates = page.getByTestId("movie-show-date");
    if ((await showDates.count()) > 0) {
      onLog(`🖱️ Selecting show date...`, "info");
      await humanClick(page, showDates.first(), 600);
    }

    const cinemaCards = page.getByTestId("movie-select-cinema");
    if ((await cinemaCards.count()) > 0) {
      onLog(`🖱️ Selecting cinema...`, "info");
      await humanClick(page, cinemaCards.first(), 600);
    }

    onLog(`🕒 Selecting showtime with virtual cursor...`, "info");
    const showtimes = page.getByTestId("movie-showtime");
    await showtimes.first().waitFor({ state: "visible", timeout: 10000 });
    await humanClick(page, showtimes.first(), 700);

    onLog(`🎟️ Moving to seat layout...`, "info");
    await humanClick(page, page.getByTestId("movie-continue-to-seats"), 800);

    // Select ticket count
    const ticketSelect = page.getByTestId("movie-ticket-count");
    if (await ticketSelect.isVisible()) {
      await humanClick(page, ticketSelect, 300);
      await ticketSelect.selectOption(String(ticketCount));
      onLog(`✓ Ticket count set to ${ticketCount}`, "info");
      await page.waitForTimeout(400);
    }

    // Pick seats visually with humanClick
    const availableSeats = page.getByTestId("movie-seat-available");
    await availableSeats.first().waitFor({ state: "visible", timeout: 10000 });
    const seatCount = await availableSeats.count();
    if (seatCount < ticketCount) {
      throw new Error(`Only ${seatCount} seat(s) available, requested ${ticketCount}`);
    }

    onLog(`🪑 Clicking available seats visually...`, "info");
    for (let i = 0; i < ticketCount; i++) {
      await humanClick(page, availableSeats.nth(i), 500);
      onLog(`✓ Seat ${i + 1} chosen`, "info");
    }

    onLog(`Proceeding to Booking Review...`, "info");
    const reviewBtn = page.getByTestId("movie-continue-to-review");
    await humanClick(page, reviewBtn, 800);

    await page.getByText("Booking Review").waitFor({ state: "visible", timeout: 10000 });
    onLog(`💳 Virtual mouse: Clicking "Continue to Payment"...`, "info");
    await humanClick(page, page.getByRole("button", { name: "Continue to Payment" }), 800);

    onLog(`📱 Payment Page loaded with Dummy UPI QR Code!`, "info");
    onLog(`👉 Awaiting REAL USER action: Please scan QR or click "✅ Payment Successful" or "❌ Payment Failed" on screen!`, "warn");

    // Wait for the real user to click either Successful or Failed button
    await page.waitForResponse(
      (response) => {
        const url = response.url();
        return url.includes("/api/bookings") && response.request().method() === "POST";
      },
      { timeout: 120000 } // Give user up to 2 minutes
    );

    onLog(`✓ User confirmed payment! Navigating to Booking Confirmation...`, "success");
    await page.waitForURL(/\/confirmation\//, { timeout: 15000 });
    await page.getByText("Booking Confirmed").waitFor({ state: "visible", timeout: 10000 });

    onLog(`🎉 BookMyShow Booking Confirmed! Ticket details are visible on your screen.`, "success");
    onLog(`📥 User can view or click "Download / Print Ticket" button. Window will remain open!`, "info");

    return { success: true, message: "Booking confirmed successfully on BookMyShow! Ticket is open on screen." };
  } catch (err: any) {
    onLog(`❌ Error in BookMyShow automation: ${err.message}`, "error");
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
