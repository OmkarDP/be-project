import express from "express";
import { createServer as createViteServer } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createScenarioManager } from "@agentic/mock-scenarios";
import { IRCTC_TRAINS, IRCTC_STATIONS, validateSearchForm } from "@agentic/mock-data";
import type { ScenarioName } from "@agentic/mock-scenarios";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 3001);

const scenarioManager = createScenarioManager();
const bookings = new Map<string, Record<string, unknown>>();
let bookingCounter = 0;

const app = express();
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, platform: "irctc", port });
});

app.get("/api/stations", (req, res) => {
  const q = String(req.query.q ?? "").trim().toLowerCase();
  const results = q
    ? IRCTC_STATIONS.filter(
        (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.city.toLowerCase().includes(q),
      )
    : IRCTC_STATIONS;
  res.json({ stations: results });
});

app.get("/api/scenario", (_req, res) => {
  res.json(scenarioManager.getState());
});

app.post("/api/scenario", (req, res) => {
  const { scenario, config } = req.body ?? {};
  scenarioManager.setScenario(scenario as ScenarioName, config ?? {});
  res.json(scenarioManager.getState());
});

app.post("/api/reset", (_req, res) => {
  scenarioManager.reset();
  bookings.clear();
  bookingCounter = 0;
  res.json(scenarioManager.getState());
});

function validateDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parts = date.split("-").map(Number);
  const y = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const d = parts[2] ?? 0;
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dt.setHours(0, 0, 0, 0);
  return dt >= today;
}

app.post("/api/search", async (req, res) => {
  const { from = "", to = "", date = "", travelClass = "ALL", quota = "GN", passengers = 1 } = req.body ?? {};
  const validation = validateSearchForm({ from: String(from), to: String(to), date: String(date) });
  const errors: Record<string, string> = { ...validation.errors };
  if (!validateDate(String(date))) errors.date = "Please enter a valid future date";
  if (String(from).trim() && String(to).trim() && String(from).trim().toLowerCase() === String(to).trim().toLowerCase()) {
    errors.to = "Origin and destination must differ";
  }
  if (scenarioManager.isValidationError()) {
    return res.status(400).json({ errors: { from: "Invalid station selection" }, message: "Invalid search input" });
  }
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors, message: "Invalid search input" });
  }

  await scenarioManager.applyDelay();

  if (scenarioManager.shouldFailOnce("search")) {
    return res.status(503).json({ message: "Temporary service error. Please retry." });
  }

  if (scenarioManager.isEmptyResults()) {
    return res.json({ results: [] });
  }

  const fromLower = String(from).toLowerCase();
  const toLower = String(to).toLowerCase();
  let results = IRCTC_TRAINS.filter(
    (t) => t.from.toLowerCase().includes(fromLower) && t.to.toLowerCase().includes(toLower),
  ).map((t) => ({ ...t }));

  if (results.length === 0) {
    results = IRCTC_TRAINS.map((t) => ({ ...t }));
  }

  if (travelClass && travelClass !== "ALL") {
    results = results.filter((t) => {
      if (t.classes && t.classes.length > 0) return t.classes.some((c) => c.classType === travelClass);
      return t.classType === travelClass;
    });
  }

  if (scenarioManager.isSoldOut()) {
    results = results.map((t) => {
      if (t.classes && t.classes.length > 0) {
        return {
          ...t,
          classes: t.classes.map((c) => ({ ...c, availableSeats: 0, status: "sold-out" as const })),
          availableSeats: 0,
          status: "sold-out" as const,
        };
      }
      return { ...t, availableSeats: 0, status: "sold-out" as const };
    });
  }

  res.json({ results, quota, passengers });
});

app.post("/api/select", (req, res) => {
  const { trainId, classType } = req.body ?? {};
  if (scenarioManager.isStaleItem(String(trainId))) {
    return res.status(409).json({ message: "This item is no longer available. Please refresh results." });
  }
  const train = IRCTC_TRAINS.find((t) => t.id === String(trainId));
  if (!train) return res.status(404).json({ message: "Train not found" });
  const cls = train.classes?.find((c) => c.classType === classType);
  if (cls && (cls.status === "sold-out" || cls.availableSeats <= 0)) {
    return res.status(409).json({ message: "Selected class is sold out." });
  }
  res.json({ ok: true, trainId, classType });
});

app.post("/api/revalidate", (req, res) => {
  const { trainId, classType } = req.body ?? {};
  if (scenarioManager.isStaleItem(String(trainId))) {
    return res.status(409).json({ message: "This item is no longer available. Please refresh results." });
  }
  res.json({ ok: true, trainId, classType });
});

app.post("/api/payment", (req, res) => {
  const { outcome = "success" } = req.body ?? {};
  if (outcome === "declined") {
    return res.status(402).json({ status: "declined", message: "Payment declined by simulation." });
  }
  if (outcome === "temporary-failure" || scenarioManager.shouldFailOnce("payment")) {
    // allow one failure then success for temporary-failure outcome
    if (outcome === "temporary-failure") {
      const count = scenarioManager.nextOperationCount("payment-temp");
      if (count === 1) {
        return res.status(503).json({ status: "temporary-failure", message: "Temporary payment failure. Please retry." });
      }
    } else if (scenarioManager.shouldFailOnce("payment")) {
      return res.status(503).json({ status: "temporary-failure", message: "Temporary payment failure. Please retry." });
    }
  }
  res.json({ status: "success", message: "Simulated payment accepted." });
});

app.post("/api/book", (req, res) => {
  const { trainId, classType, passengers = [], search = {}, totalAmount = 0 } = req.body ?? {};
  if (scenarioManager.isStaleItem(String(trainId))) {
    return res.status(409).json({ message: "This item is no longer available. Please refresh results." });
  }
  if (!scenarioManager.bookingSucceeds()) {
    return res.status(400).json({ message: "Booking could not be completed. Please try again." });
  }
  bookingCounter += 1;
  const bookingId = `IRCTC-MOCK-${bookingCounter}`;
  const pnr = `PNR${String(bookingCounter).padStart(6, "0")}`;
  const record = {
    bookingId,
    pnr,
    platform: "irctc",
    status: "confirmed",
    createdAt: new Date().toISOString(),
    totalAmount: Number(totalAmount) || 0,
    currency: "INR",
    trainId: String(trainId),
    classType: String(classType),
    passengers,
    search,
  };
  bookings.set(bookingId, record);
  res.json({ bookingId, pnr, status: "confirmed", platform: "irctc", booking: record });
});

app.get("/api/bookings", (_req, res) => {
  res.json({ bookings: Array.from(bookings.values()) });
});

app.get("/api/bookings/:id", (req, res) => {
  const record = bookings.get(req.params.id);
  if (!record) return res.status(404).json({ message: "Booking not found" });
  res.json({ booking: record });
});

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      root,
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(root, "dist")));
    app.get("*", (_req, res) => res.sendFile(path.join(root, "dist", "index.html")));
  }
  app.listen(port, () => {
    console.log(`mock-irctc listening on http://localhost:${port}`);
  });
}

start();
