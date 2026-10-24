import type { Page } from "@playwright/test";

/**
 * Shared fixtures for the RedBus clone (apps/mock-redbus).
 *
 * The clone's frontend hard-codes a dead Heroku backend and requires Google
 * login, so the specs:
 *  - intercept every /v1/api/** call and serve deterministic fixtures
 *  - expose the Redux store (dev builds use the devtools compose hook) and
 *    dispatch the login actions directly instead of driving Google OAuth
 */

export const REDBUS_BASE = "http://localhost:3002";

const ROUTE = {
  _id: "64b000000000000000000010",
  departureLocation: {
    name: "Lucknow",
    subLocations: ["Alambagh", "Charbagh", "Kaiserbagh"],
  },
  arrivalLocation: {
    name: "Faizabad",
    subLocations: ["Faizabad Bus Stand", "Ayodhya Road"],
  },
  duration: 6,
};

const BUS_ID = "64b0000000000000000000b1";

const BUS = {
  _id: BUS_ID,
  operatorName: "Sunrise Express",
  busType: 3, // A/C Seater -> seat price = 125 * floor(duration / 2)
  departureTime: 9,
  rating: [1, 2, 3, 4, 5],
  liveTracking: 1,
  reschedulable: 1,
};

const SEARCH_RESULT = {
  route: ROUTE,
  matchedBuses: [BUS],
  // seats 1-3 are already booked, 4-40 are available
  busIdWithSeatsObj: { [BUS_ID]: [1, 2, 3] },
};

export const CUSTOMER_ID = "64b0000000000000000000aa";

export async function mockRedbusApi(page: Page) {
  await page.route("**/v1/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const headers = {
      "access-control-allow-origin": "*",
      "content-type": "application/json",
    };
    const json = (body: unknown) =>
      route.fulfill({ status: 200, headers, body: JSON.stringify(body) });

    if (path === "/v1/api/routes") {
      return json([ROUTE]);
    }
    if (path.startsWith("/v1/api/routes/")) {
      return json(SEARCH_RESULT);
    }
    if (path === "/v1/api/customers") {
      return json({ _id: CUSTOMER_ID });
    }
    if (path.startsWith("/v1/api/booking")) {
      return json([
        {
          _id: "RB-BK-" + Date.now(),
          bookingDate: "2026-11-15",
          busId: "64b0000000000000000000b1",
          departureDetails: {
            city: "Lucknow",
            location: "Alambagh",
            date: "2026-11-15",
            time: 9,
          },
          arrivalDetails: {
            city: "Faizabad",
            location: "Faizabad Bus Stand",
            date: "2026-11-15",
            time: 15,
          },
          fare: 375,
          seats: ["4"],
          passengerDetails: [
            {
              name: "Playwright User",
              gender: "Male",
              age: "25",
            },
          ],
        },
      ]);
    }
    return json({});
  });
}

/**
 * Runs before the app bundle: wraps the devtools compose hook so the Redux
 * store is reachable from tests (no source changes needed).
 */
export async function installStoreProbe(page: Page) {
  await page.addInitScript(() => {
    (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ =
      () =>
      (...enhancers: any[]) =>
      (createStore: any) =>
      (reducer: any, preloadedState: any) => {
        const composed = enhancers.reduceRight(
          (next, enhancer) => enhancer(next),
          createStore,
        );
        const store = composed(reducer, preloadedState);
        (window as any).__store = store;
        return store;
      };
  });
}

/** Marks the session as a signed-in Google customer (needed by seat + payment). */
export async function loginAsDemoCustomer(page: Page) {
  await page.waitForFunction(() => Boolean((window as any).__store));
  await page.evaluate((customerId) => {
    const store = (window as any).__store;
    store.dispatch({
      type: "LOGIN_SUCCESS",
      payload: {
        name: "Playwright User",
        googleId: "pw-google-1",
        email: "pw@example.com",
        imageUrl: "",
      },
    });
    store.dispatch({ type: "ADD_CUSTOMER_MONGO_SUCCESS", payload: customerId });
  }, CUSTOMER_ID);
}

/** Home page search: Lucknow -> Faizabad on a fixed date -> /select-bus */
export async function searchLucknowToFaizabad(page: Page, date: string) {
  await page.getByPlaceholder("Source").fill("Lucknow");
  await page
    .locator('[class*="LandingPage__form__departure__dropdown"] li')
    .filter({ hasText: "Lucknow" })
    .first()
    .click();

  await page.getByPlaceholder("Destination").fill("Faizabad");
  await page
    .locator('[class*="LandingPage__form__arrival__dropdown"] li')
    .filter({ hasText: "Faizabad" })
    .first()
    .click();

  await page.locator('input[type="date"]').fill(date);
  await page.getByRole("button", { name: "Search Bus" }).click();
}
