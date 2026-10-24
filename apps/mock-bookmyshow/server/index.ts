import express from "express";
import { createServer as createViteServer } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createScenarioManager } from "@agentic/mock-scenarios";
import type { ScenarioName } from "@agentic/mock-scenarios";
import { validateSearchForm } from "@agentic/mock-data";
import {
  CITIES,
  MOVIES,
  CINEMAS,
  listMovies,
  getMovie,
  listCinemas,
  listShowtimes,
  getShowtimeInfo,
  getSeats,
  getUnavailableSeatIds,
  createHold,
  getHold,
  releaseHold,
  confirmBooking,
  getBooking,
  listBookings,
  resetInventory,
  getHoldRemainingMs,
  isHoldExpired,
} from "./inventory.js";
import { now as clockNow, advance as clockAdvance, setNow as clockSet, resetClock } from "./clock.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 3003);

const scenarioManager = createScenarioManager();
const app = express();
app.use(express.json());

// health
app.get("/api/health", (_req, res) => res.json({ ok: true, platform: "bookmyshow", port }));

// scenario
app.get("/api/scenario", (_req, res) => res.json(scenarioManager.getState()));
app.post("/api/scenario", (req, res) => {
  const { scenario, config } = req.body ?? {};
  scenarioManager.setScenario(scenario as ScenarioName, config ?? {});
  res.json(scenarioManager.getState());
});
app.post("/api/reset", (_req, res) => {
  scenarioManager.reset();
  resetInventory();
  resetClock();
  res.json(scenarioManager.getState());
});

// clock
app.get("/api/clock", (_req, res) => res.json({ now: clockNow() }));
app.post("/api/clock", (req, res) => {
  const { now: n, advanceMs, offsetMs } = req.body ?? {};
  if (typeof n === "number") clockSet(n);
  if (typeof advanceMs === "number") clockAdvance(advanceMs);
  if (typeof offsetMs === "number") clockAdvance(offsetMs);
  res.json({ now: clockNow() });
});
app.post("/api/clock/advance", (req, res) => {
  const { ms } = req.body ?? {};
  clockAdvance(Number(ms) || 0);
  res.json({ now: clockNow() });
});

// cities
app.get("/api/cities", (_req, res) => res.json({ cities: CITIES }));

// movies
app.get("/api/movies", (req, res) => {
  const city = String(req.query.city ?? "");
  const q = String(req.query.q ?? "").toLowerCase();
  const genre = String(req.query.genre ?? "");
  const language = String(req.query.language ?? "");
  const format = String(req.query.format ?? "");
  let movies = listMovies(city || undefined);
  if (q) movies = movies.filter((m) => m.title.toLowerCase().includes(q));
  if (genre && genre !== "all") movies = movies.filter((m) => m.genre === genre);
  if (language && language !== "all") movies = movies.filter((m) => m.language === language);
  if (format && format !== "all") movies = movies.filter((m) => m.formats.includes(format as "2D" | "3D" | "IMAX"));
  // scenario empty-results
  if (scenarioManager.isEmptyResults()) movies = [];
  res.json({ movies });
});

app.get("/api/movies/:id", (req, res) => {
  const movie = getMovie(req.params.id);
  if (!movie) return res.status(404).json({ message: "Movie not found" });
  const city = String(req.query.city ?? "");
  const cinemas = listCinemas(req.params.id, city || undefined);
  const dates = Array.from(new Set(listShowtimes(req.params.id, city || undefined).map((s) => s.date))).sort();
  res.json({ movie, cinemas, dates });
});

// cinemas
app.get("/api/cinemas", (req, res) => {
  const movieId = req.query.movieId ? String(req.query.movieId) : undefined;
  const city = req.query.city ? String(req.query.city) : undefined;
  res.json({ cinemas: listCinemas(movieId, city) });
});

// showtimes
app.get("/api/showtimes", (req, res) => {
  const movieId = req.query.movieId ? String(req.query.movieId) : undefined;
  const city = req.query.city ? String(req.query.city) : undefined;
  const date = req.query.date ? String(req.query.date) : undefined;
  const cinemaId = req.query.cinemaId ? String(req.query.cinemaId) : undefined;
  let showtimes = listShowtimes(movieId, city, date, cinemaId);
  if (scenarioManager.isSoldOut()) {
    showtimes = showtimes.map((s) => ({ ...s, availableSeats: 0, status: "sold-out" as const }));
  }
  res.json({ showtimes });
});

// seats
app.get("/api/seats", (req, res) => {
  const showtimeId = String(req.query.showtimeId ?? "");
  const sessionId = req.query.sessionId ? String(req.query.sessionId) : "";
  const seats = getSeats(showtimeId);
  const now = clockNow();
  const unavailable = getUnavailableSeatIds(showtimeId, now, sessionId || undefined);
  const withStatus = seats.map((s) => ({
    ...s,
    status: unavailable.has(s.id) ? "unavailable" : "available",
  }));
  res.json({ seats: withStatus });
});

// holds
app.post("/api/holds", async (req, res) => {
  await scenarioManager.applyDelay();
  if (scenarioManager.shouldFailOnce("hold")) {
    return res.status(503).json({ message: "Temporary service error. Please retry." });
  }
  const { showtimeId, seats, sessionId, ticketCount, holdDurationMs } = req.body ?? {};
  const config = scenarioManager.getConfig();
  if (!showtimeId || !Array.isArray(seats) || !sessionId) {
    return res.status(400).json({ message: "Invalid hold request" });
  }
  if (typeof ticketCount === "number" && seats.length !== ticketCount) {
    return res.status(400).json({ message: "Seat count must match ticket count" });
  }
  const result = createHold({ showtimeId, seats, sessionId, holdDurationMs: holdDurationMs ?? config.holdDurationMs });
  if ("error" in result) return res.status(400).json({ message: result.error });
  if ("conflict" in result) {
    return res.status(409).json({ message: "Selected seats are no longer available", conflictSeats: result.conflict });
  }
  const hold = result.hold;
  res.json({
    holdId: hold.id,
    showtimeId: hold.showtimeId,
    seats: hold.seats,
    createdAt: hold.createdAt,
    expiresAt: hold.expiresAt,
    remainingMs: getHoldRemainingMs(hold),
  });
});

app.get("/api/holds/:id", (req, res) => {
  const hold = getHold(req.params.id);
  if (!hold) return res.status(404).json({ message: "Hold not found" });
  const expired = isHoldExpired(hold);
  res.json({
    holdId: hold.id,
    showtimeId: hold.showtimeId,
    seats: hold.seats,
    status: expired ? "expired" : hold.status,
    expired,
    expiresAt: hold.expiresAt,
    remainingMs: getHoldRemainingMs(hold),
  });
});

app.delete("/api/holds/:id", (req, res) => {
  releaseHold(req.params.id);
  res.json({ ok: true });
});

// bookings
app.post("/api/bookings", async (req, res) => {
  await scenarioManager.applyDelay();
  if (scenarioManager.shouldFailOnce("booking")) {
    return res.status(503).json({ message: "Temporary service error. Please retry." });
  }
  const { holdId, sessionId, food, contact, paymentMethod, paymentOutcome, convenienceFee } = req.body ?? {};
  if (!holdId || !sessionId) return res.status(400).json({ message: "Missing hold or session" });
  if (paymentOutcome && paymentOutcome !== "success") {
    // failed payment: do not create booking; preserve hold
    return res.status(400).json({ message: "Payment failed", paymentOutcome });
  }
  if (scenarioManager.isStaleItem(String(holdId))) {
    return res.status(409).json({ message: "This item is no longer available. Please refresh results." });
  }
  if (!scenarioManager.bookingSucceeds()) {
    return res.status(400).json({ message: "Booking could not be completed. Please try again." });
  }
  const result = confirmBooking({
    holdId,
    sessionId,
    food: Array.isArray(food) ? food : [],
    contact: contact ?? { name: "", email: "", phone: "" },
    paymentMethod: paymentMethod ?? "UPI",
    convenienceFee: typeof convenienceFee === "number" ? convenienceFee : 40,
  });
  if ("error" in result) {
    const status = result.code === "HOLD_EXPIRED" ? 409 : 400;
    return res.status(status).json({ message: result.error, code: result.code, conflictSeats: result.conflict });
  }
  res.json({ booking: result.booking });
});

app.get("/api/bookings/:id", (req, res) => {
  const booking = getBooking(req.params.id);
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  res.json({ booking });
});

app.get("/api/bookings", (req, res) => {
  const sessionId = String(req.query.sessionId ?? "");
  res.json({ bookings: listBookings(sessionId) });
});

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ root, server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(root, "dist")));
    app.get("*", (_req, res) => res.sendFile(path.join(root, "dist", "index.html")));
  }
  app.listen(port, () => console.log(`mock-bookmyshow listening on http://localhost:${port}`));
}
start();
