import React, { useEffect, useState } from "react";
import { useStore } from "../store";
import { navigate } from "../App";
import { Api } from "../api";

export default function MovieDetailPage({ movieId }: { movieId: string }) {
  const { draft, setDraft } = useStore();
  const [movie, setMovie] = useState<any>(null);
  const [cinemas, setCinemas] = useState<any[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(draft.date);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const data = await Api.movie(movieId, draft.city);
        if (!active) return;
        setMovie(data.movie);
        setCinemas(data.cinemas ?? []);
        setDates(data.dates ?? []);
        if (!selectedDate && data.dates?.length) setSelectedDate(data.dates[0]);
      } catch {
        if (active) setMovie(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [movieId, draft.city]);

  useEffect(() => {
    setDraft((prev) => ({ ...prev, movieId }));
  }, [movieId, setDraft]);

  if (loading) return <LoadingSpinnerWrap />;
  if (!movie) return <div className="card">Movie not found.</div>;

  return (
    <div data-testid="movie-detail">
      <div className="card">
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div className="poster" style={{ width: 180, height: 240, background: movie.posterGradient, borderRadius: 12 }}>
            <span style={{ fontSize: 56 }}>{movie.initials}</span>
          </div>
          <div style={{ flex: 1 }}>
            <h1>{movie.title}</h1>
            <div style={{ margin: "8px 0" }}>
              <span className="chip">{movie.genre}</span>
              <span className="chip">{movie.language}</span>
              <span className="chip">{movie.runtime} min</span>
              <span className="chip">{movie.classification}</span>
            </div>
            <p>{movie.synopsis}</p>
            <div style={{ color: "var(--muted)" }}>Rating: {movie.rating}/10 • Formats: {movie.formats.join(", ")}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Available Dates</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {dates.map((d) => (
            <button
              key={d}
              data-testid="movie-show-date"
              className="btn secondary"
              style={{ background: selectedDate === d ? "var(--accent)" : undefined, color: selectedDate === d ? "#111" : undefined }}
              onClick={() => {
                setSelectedDate(d);
                setDraft((prev) => ({ ...prev, date: d }));
              }}
            >
              {d}
            </button>
          ))}
          {dates.length === 0 && <p>No shows in {draft.city}.</p>}
        </div>
      </div>

      <div className="card">
        <h2>Cinemas in {draft.city}</h2>
        <div data-testid="movie-cinema-list" style={{ display: "grid", gap: 12 }}>
          {cinemas.map((c) => (
            <div key={c.id} className="card" data-testid="movie-cinema-card" style={{ margin: 0 }}>
              <strong>{c.name}</strong>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>{c.area} • {c.formats?.join?.(", ") ?? c.formats}</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>From {c.minPrice ? `₹${c.minPrice}` : "—"} • {c.showCount} show(s)</div>
              <button
                className="btn"
                data-testid="movie-select-cinema"
                style={{ marginTop: 8 }}
                onClick={() => {
                  setDraft((prev) => ({ ...prev, cinemaId: c.id, date: selectedDate ?? prev.date }));
                  navigate("/shows");
                }}
              >
                View Showtimes
              </button>
            </div>
          ))}
          {cinemas.length === 0 && <p>No cinemas for this movie in {draft.city}.</p>}
        </div>
      </div>

      <button
        className="btn"
        onClick={() => {
          setDraft((prev) => ({ ...prev, movieId, date: selectedDate ?? prev.date }));
          navigate("/shows");
        }}
      >
        Book Tickets
      </button>
    </div>
  );
}

function LoadingSpinnerWrap() {
  return <div className="card">Loading...</div>;
}
