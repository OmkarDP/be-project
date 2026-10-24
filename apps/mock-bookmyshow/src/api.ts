const BASE = "";

export async function apiFetch<T = any>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: any = new Error(data?.message || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data as T;
}

export const Api = {
  health: () => apiFetch("/api/health"),
  scenario: () => apiFetch("/api/scenario"),
  setScenario: (scenario: string, config: any = {}) =>
    apiFetch("/api/scenario", { method: "POST", body: JSON.stringify({ scenario, config }) }),
  reset: () => apiFetch("/api/reset", { method: "POST" }),
  cities: () => apiFetch("/api/cities"),
  movies: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/api/movies?${qs}`);
  },
  movie: (id: string, city?: string) => apiFetch(`/api/movies/${id}${city ? `?city=${encodeURIComponent(city)}` : ""}`),
  cinemas: (movieId?: string, city?: string) => {
    const qs = new URLSearchParams();
    if (movieId) qs.set("movieId", movieId);
    if (city) qs.set("city", city);
    return apiFetch(`/api/cinemas?${qs}`);
  },
  showtimes: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/api/showtimes?${qs}`);
  },
  seats: (showtimeId: string, sessionId?: string) =>
    apiFetch(`/api/seats?showtimeId=${encodeURIComponent(showtimeId)}${sessionId ? `&sessionId=${encodeURIComponent(sessionId)}` : ""}`),
  createHold: (body: any) => apiFetch("/api/holds", { method: "POST", body: JSON.stringify(body) }),
  getHold: (id: string) => apiFetch(`/api/holds/${id}`),
  releaseHold: (id: string) => apiFetch(`/api/holds/${id}`, { method: "DELETE" }),
  createBooking: (body: any) => apiFetch("/api/bookings", { method: "POST", body: JSON.stringify(body) }),
  getBooking: (id: string) => apiFetch(`/api/bookings/${id}`),
  listBookings: (sessionId: string) => apiFetch(`/api/bookings?sessionId=${encodeURIComponent(sessionId)}`),
  clock: () => apiFetch("/api/clock"),
  advanceClock: (ms: number) => apiFetch("/api/clock/advance", { method: "POST", body: JSON.stringify({ ms }) }),
  setClock: (body: any) => apiFetch("/api/clock", { method: "POST", body: JSON.stringify(body) }),
};
