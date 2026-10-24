import React, { useEffect, useState } from "react";
import { useStore } from "../store";
import { navigate } from "../App";
import { Api } from "../api";

export default function ShowsPage() {
  const { draft, setDraft } = useStore();
  const [showtimes, setShowtimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(draft.date ?? "");

  useEffect(() => {
    if (!draft.movieId) {
      navigate("/movies");
    }
  }, [draft.movieId]);

  useEffect(() => {
    async function loadDates() {
      if (!draft.movieId) return;
      try {
        const data = await Api.showtimes({ movieId: draft.movieId, city: draft.city });
        const ds = Array.from(new Set((data.showtimes ?? []).map((s: any) => s.date))).sort();
        if (!selectedDate && ds.length) setSelectedDate(String(ds[0]));
      } catch {
        // ignore
      }
    }
    loadDates();
  }, [draft.movieId, draft.city]);

  useEffect(() => {
    async function load() {
      if (!draft.movieId) return;
      setLoading(true);
      try {
        const params: Record<string, string> = { movieId: draft.movieId, city: draft.city };
        if (selectedDate) params.date = selectedDate;
        const data = await Api.showtimes(params);
        setShowtimes(data.showtimes ?? []);
      } catch {
        setShowtimes([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [draft.movieId, draft.city, selectedDate]);

  function selectShowtime(st: any) {
    if (draft.holdId) {
      Api.releaseHold(draft.holdId).catch(() => {});
    }
    setDraft((prev) => ({
      ...prev,
      showtimeId: st.id,
      movieId: st.movieId,
      cinemaId: st.cinemaId,
      date: st.date,
      selectedSeats: [],
      holdId: null,
      holdExpiresAt: null,
    }));
  }

  const selected = showtimes.find((s) => s.id === draft.showtimeId);
  const dates = Array.from(new Set(showtimes.map((s) => s.date))).sort();

  return (
    <div>
      <div className="card">
        <h1>Showtimes</h1>
        <p>{draft.city}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {dates.map((d) => (
            <button
              key={d}
              className="btn secondary"
              style={{ background: selectedDate === d ? "var(--accent)" : undefined, color: selectedDate === d ? "#111" : undefined }}
              onClick={() => setSelectedDate(d)}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="card">Loading...</div>}

      <div data-testid="movie-showtime-list" className="card">
        {showtimes
          .filter((s) => !selectedDate || s.date === selectedDate)
          .map((st) => (
            <div key={st.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 8, borderBottom: "1px solid var(--border)" }}>
              <div>
                <strong>{st.cinemaName}</strong> • {st.cinemaArea}
                <div style={{ fontSize: 13, color: "var(--muted)" }}>
                  {st.time} • {st.format} • {st.language} • ₹{st.price}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span data-testid="movie-showtime-status" style={{ color: st.status === "sold-out" ? "var(--danger)" : "var(--success)" }}>
                  {st.status === "sold-out" ? "Sold out" : `${st.availableSeats} seats`}
                </span>
                <button
                  data-testid="movie-showtime"
                  className="btn"
                  disabled={st.status === "sold-out" || st.availableSeats <= 0}
                  onClick={() => selectShowtime(st)}
                  style={{ background: draft.showtimeId === st.id ? "var(--accent)" : undefined }}
                >
                  {st.time}
                </button>
              </div>
            </div>
          ))}
        {showtimes.filter((s) => !selectedDate || s.date === selectedDate).length === 0 && !loading && (
          <p>No showtimes for this date.</p>
        )}
      </div>

      {selected && (
        <div className="card" data-testid="movie-selected-showtime">
          <strong>Selected:</strong> {selected.movieTitle} at {selected.cinemaName} • {selected.date} {selected.time} • {selected.format}
        </div>
      )}

      <button
        className="btn"
        data-testid="movie-continue-to-seats"
        disabled={!draft.showtimeId}
        onClick={() => navigate("/seats")}
      >
        Continue to Seats
      </button>
      <button className="btn secondary" style={{ marginLeft: 8 }} onClick={() => navigate("/movies/" + draft.movieId)}>
        Back to Movie
      </button>
    </div>
  );
}
