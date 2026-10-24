import { CITIES, CINEMAS, MOVIES, SHOWTIMES, type ShowtimeSeed } from "./data.js";
import { now as clockNow } from "./clock.js";

export interface Seat {
  id: string;
  row: string;
  number: number;
  category: "Silver" | "Gold" | "Premium";
  price: number;
}

export interface ShowtimeInfo {
  id: string;
  movieId: string;
  movieTitle: string;
  city: string;
  cinemaId: string;
  cinemaName: string;
  cinemaArea: string;
  date: string;
  time: string;
  format: "2D" | "3D" | "IMAX";
  language: string;
  price: number;
  status: "available" | "sold-out";
}

export interface Hold {
  id: string;
  showtimeId: string;
  sessionId: string;
  seats: string[];
  createdAt: number;
  expiresAt: number;
  status: "active" | "expired" | "confirmed" | "released";
}

export interface BookingRecord {
  bookingId: string;
  sessionId: string;
  showtimeId: string;
  movieId: string;
  movieTitle: string;
  city: string;
  cinemaName: string;
  date: string;
  time: string;
  format: string;
  seats: Array<{ id: string; row: string; number: number; category: string; price: number }>;
  ticketCount: number;
  food: Array<{ id: string; name: string; price: number; quantity: number }>;
  contact: { name: string; email: string; phone: string };
  paymentMethod: string;
  convenienceFee: number;
  foodSubtotal: number;
  ticketSubtotal: number;
  total: number;
  status: "confirmed";
  createdAt: string;
}

const CATEGORY_PRICES: Record<Seat["category"], number> = {
  Silver: 180,
  Gold: 280,
  Premium: 450,
};

const ROWS: Array<{ row: string; category: Seat["category"] }> = [
  { row: "A", category: "Silver" },
  { row: "B", category: "Silver" },
  { row: "C", category: "Gold" },
  { row: "D", category: "Gold" },
  { row: "E", category: "Gold" },
  { row: "F", category: "Premium" },
  { row: "G", category: "Premium" },
  { row: "H", category: "Premium" },
];

function cinemaById(id: string) {
  return CINEMAS.find((c) => c.id === id);
}

function movieById(id: string) {
  return MOVIES.find((m) => m.id === id);
}

// state
const seatsByShowtime = new Map<string, Seat[]>();
const bookedSeats = new Map<string, Set<string>>();
const holds = new Map<string, Hold>();
const bookings = new Map<string, BookingRecord>();

let initialized = false;

function initSeats() {
  if (initialized) return;
  initialized = true;
  for (const st of SHOWTIMES) {
    const seats: Seat[] = [];
    for (const r of ROWS) {
      for (let n = 1; n <= 12; n++) {
        if (n === 5 || n === 9) continue; // aisles (no seat)
        const id = `${r.row}${n}`;
        seats.push({ id, row: r.row, number: n, category: r.category, price: CATEGORY_PRICES[r.category] });
      }
    }
    seatsByShowtime.set(st.id, seats);
    const booked = new Set<string>();
    if (st.status === "sold-out") {
      for (const s of seats) booked.add(s.id);
    } else {
      // deterministic ~15% booked
      for (const s of seats) {
        const hash = (st.id + s.id).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
        if (hash % 7 === 0) booked.add(s.id);
      }
    }
    bookedSeats.set(st.id, booked);
  }
}

export function resetInventory(): void {
  seatsByShowtime.clear();
  bookedSeats.clear();
  holds.clear();
  bookings.clear();
  initialized = false;
  initSeats();
}

initSeats();

export function listCities() {
  return CITIES;
}

export function listMovies(city?: string) {
  const cityShows = city ? SHOWTIMES.filter((s) => s.city === city) : SHOWTIMES;
  const movieIds = new Set(cityShows.map((s) => s.movieId));
  return MOVIES.map((m) => ({
    ...m,
    hasShows: movieIds.has(m.id),
    showCount: cityShows.filter((s) => s.movieId === m.id).length,
  }));
}

export function getMovie(id: string) {
  return MOVIES.find((m) => m.id === id);
}

export function listCinemas(movieId?: string, city?: string) {
  let showtimes = SHOWTIMES;
  if (movieId) showtimes = showtimes.filter((s) => s.movieId === movieId);
  if (city) showtimes = showtimes.filter((s) => s.city === city);
  const cinemaIds = new Set(showtimes.map((s) => s.cinemaId));
  return CINEMAS.filter((c) => cinemaIds.has(c.id) && (!city || c.city === city)).map((c) => {
    const sts = showtimes.filter((s) => s.cinemaId === c.id);
    const dates = Array.from(new Set(sts.map((s) => s.date))).sort();
    const prices = sts.map((s) => s.price);
    return {
      ...c,
      showDates: dates,
      minPrice: prices.length ? Math.min(...prices) : null,
      showCount: sts.length,
    };
  });
}

export function listShowtimes(movieId?: string, city?: string, date?: string, cinemaId?: string) {
  let filtered = SHOWTIMES.slice();
  if (movieId) filtered = filtered.filter((s) => s.movieId === movieId);
  if (city) filtered = filtered.filter((s) => s.city === city);
  if (date) filtered = filtered.filter((s) => s.date === date);
  if (cinemaId) filtered = filtered.filter((s) => s.cinemaId === cinemaId);
  const now = clockNow();
  expireHolds(now);
  return filtered.map((s) => {
    const movie = movieById(s.movieId);
    const cinema = cinemaById(s.cinemaId);
    const available = getAvailableSeatCount(s.id, now);
    return {
      id: s.id,
      movieId: s.movieId,
      movieTitle: movie?.title ?? s.movieId,
      city: s.city,
      cinemaId: s.cinemaId,
      cinemaName: cinema?.name ?? s.cinemaId,
      cinemaArea: cinema?.area ?? "",
      date: s.date,
      time: s.time,
      format: s.format,
      language: s.language,
      price: s.price,
      status: available <= 0 ? "sold-out" : s.status,
      availableSeats: available,
    };
  });
}

export function getShowtimeInfo(id: string): ShowtimeInfo | undefined {
  const s = SHOWTIMES.find((x) => x.id === id);
  if (!s) return undefined;
  const cinema = cinemaById(s.cinemaId);
  const movie = movieById(s.movieId);
  return {
    id: s.id,
    movieId: s.movieId,
    movieTitle: movie?.title ?? s.movieId,
    city: s.city,
    cinemaId: s.cinemaId,
    cinemaName: cinema?.name ?? s.cinemaId,
    cinemaArea: cinema?.area ?? "",
    date: s.date,
    time: s.time,
    format: s.format,
    language: s.language,
    price: s.price,
    status: s.status,
  };
}

export function getSeats(showtimeId: string): Seat[] {
  initSeats();
  return seatsByShowtime.get(showtimeId) ?? [];
}

function getHoldSeats(showtimeId: string, now: number, excludeHoldId?: string): Set<string> {
  const result = new Set<string>();
  for (const h of holds.values()) {
    if (h.showtimeId !== showtimeId) continue;
    if (h.id === excludeHoldId) continue;
    if (h.status !== "active") continue;
    if (h.expiresAt <= now) continue;
    for (const seat of h.seats) result.add(seat);
  }
  return result;
}

export function expireHolds(now: number): void {
  for (const h of holds.values()) {
    if (h.status === "active" && h.expiresAt <= now) {
      h.status = "expired";
    }
  }
}

export function getAvailableSeatCount(showtimeId: string, now: number): number {
  expireHolds(now);
  const seats = getSeats(showtimeId);
  const booked = bookedSeats.get(showtimeId) ?? new Set();
  const held = getHoldSeats(showtimeId, now);
  return seats.filter((s) => !booked.has(s.id) && !held.has(s.id)).length;
}

export function getUnavailableSeatIds(showtimeId: string, now: number, excludeSessionId?: string): Set<string> {
  expireHolds(now);
  const result = new Set<string>();
  const booked = bookedSeats.get(showtimeId) ?? new Set();
  for (const id of booked) result.add(id);
  const held = getHeldSeatsExcluding(showtimeId, now, excludeSessionId);
  for (const id of held) result.add(id);
  return result;
}

export function getHeldSeatsExcluding(showtimeId: string, now: number, excludeSessionId?: string): Set<string> {
  expireHolds(now);
  const result = new Set<string>();
  for (const h of holds.values()) {
    if (h.showtimeId !== showtimeId) continue;
    if (h.status !== "active" || h.expiresAt <= now) continue;
    if (excludeSessionId && h.sessionId === excludeSessionId) continue;
    for (const seat of h.seats) result.add(seat);
  }
  return result;
}

export function isSeatAvailable(showtimeId: string, seatId: string, now: number, excludeHoldId?: string): boolean {
  expireHolds(now);
  const seats = getSeats(showtimeId);
  if (!seats.find((s) => s.id === seatId)) return false;
  const booked = bookedSeats.get(showtimeId) ?? new Set();
  if (booked.has(seatId)) return false;
  const held = getHoldSeats(showtimeId, now, excludeHoldId);
  return !held.has(seatId);
}

export function createHold(params: {
  showtimeId: string;
  seats: string[];
  sessionId: string;
  holdDurationMs?: number;
}): { hold: Hold } | { conflict: string[] } | { error: string } {
  const now = clockNow();
  expireHolds(now);
  const { showtimeId, seats, sessionId } = params;
  const showtime = SHOWTIMES.find((s) => s.id === showtimeId);
  if (!showtime) return { error: "Showtime not found" };
  const seatList = getSeats(showtimeId);
  const seatIds = new Set(seatList.map((s) => s.id));
  const invalid = seats.filter((id) => !seatIds.has(id));
  if (invalid.length) return { error: "Unknown seats" };
  // release previous holds for same session+showtime
  for (const h of holds.values()) {
    if (h.sessionId === sessionId && h.showtimeId === showtimeId && h.status === "active") {
      h.status = "released";
    }
  }
  const conflict: string[] = [];
  for (const id of seats) {
    if (!isSeatAvailable(showtimeId, id, now)) conflict.push(id);
  }
  if (conflict.length) return { conflict };
  const duration = Math.max(0, params.holdDurationMs ?? 120000);
  const hold: Hold = {
    id: `hold-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    showtimeId,
    sessionId,
    seats: [...seats],
    createdAt: now,
    expiresAt: now + duration,
    status: "active",
  };
  holds.set(hold.id, hold);
  return { hold };
}

export function getHold(id: string): Hold | undefined {
  const now = clockNow();
  expireHolds(now);
  return holds.get(id);
}

export function releaseHold(id: string): void {
  const h = holds.get(id);
  if (h) h.status = "released";
}

export function confirmBooking(params: {
  holdId: string;
  sessionId: string;
  food: Array<{ id: string; name: string; price: number; quantity: number }>;
  contact: { name: string; email: string; phone: string };
  paymentMethod: string;
  convenienceFee: number;
}): { booking: BookingRecord } | { error: string; code?: string; conflict?: string[] } {
  const now = clockNow();
  expireHolds(now);
  const hold = holds.get(params.holdId);
  if (!hold || hold.sessionId !== params.sessionId) return { error: "Hold not found", code: "HOLD_NOT_FOUND" };
  if (hold.status !== "active" || hold.expiresAt <= now) {
    hold.status = "expired";
    return { error: "Seat hold has expired", code: "HOLD_EXPIRED" };
  }
  // conflict check
  const conflict: string[] = [];
  const booked = bookedSeats.get(hold.showtimeId) ?? new Set();
  const otherHeld = getHoldSeats(hold.showtimeId, now, hold.id);
  for (const seatId of hold.seats) {
    if (booked.has(seatId) || otherHeld.has(seatId)) conflict.push(seatId);
  }
  if (conflict.length) return { error: "Seat conflict", code: "SEAT_CONFLICT", conflict };

  const showtime = SHOWTIMES.find((s) => s.id === hold.showtimeId);
  if (!showtime) return { error: "Showtime not found" };
  const movie = movieById(showtime.movieId);
  const cinema = cinemaById(showtime.cinemaId);
  const seatObjects = hold.seats.map((id) => {
    const seat = getSeats(hold.showtimeId).find((s) => s.id === id)!;
    return { id: seat.id, row: seat.row, number: seat.number, category: seat.category, price: seat.price };
  });
  const ticketSubtotal = seatObjects.reduce((a, s) => a + s.price, 0);
  const foodSubtotal = params.food.reduce((a, f) => a + f.price * f.quantity, 0);
  const total = ticketSubtotal + params.convenienceFee + foodSubtotal;

  // mark booked
  const bs = bookedSeats.get(hold.showtimeId) ?? new Set();
  for (const id of hold.seats) bs.add(id);
  bookedSeats.set(hold.showtimeId, bs);

  hold.status = "confirmed";

  const bookingId = `BMS-MOCK-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`;
  const booking: BookingRecord = {
    bookingId,
    sessionId: params.sessionId,
    showtimeId: hold.showtimeId,
    movieId: showtime.movieId,
    movieTitle: movie?.title ?? showtime.movieId,
    city: showtime.city,
    cinemaName: cinema?.name ?? showtime.cinemaId,
    date: showtime.date,
    time: showtime.time,
    format: showtime.format,
    seats: seatObjects,
    ticketCount: hold.seats.length,
    food: params.food,
    contact: params.contact,
    paymentMethod: params.paymentMethod,
    convenienceFee: params.convenienceFee,
    foodSubtotal,
    ticketSubtotal,
    total,
    status: "confirmed",
    createdAt: new Date(now).toISOString(),
  };
  bookings.set(bookingId, booking);
  // release hold
  holds.delete(hold.id);
  return { booking };
}

export function getBooking(id: string): BookingRecord | undefined {
  return bookings.get(id);
}

export function listBookings(sessionId: string): BookingRecord[] {
  return [...bookings.values()].filter((b) => b.sessionId === sessionId);
}

export function getHoldRemainingMs(hold: Hold): number {
  const now = clockNow();
  return Math.max(0, hold.expiresAt - now);
}

export function isHoldExpired(hold: Hold): boolean {
  return clockNow() >= hold.expiresAt;
}

export { MOVIES, CINEMAS, SHOWTIMES, CITIES };
export type { ShowtimeSeed };
