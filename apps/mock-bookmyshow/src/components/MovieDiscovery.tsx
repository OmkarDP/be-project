import React, { useEffect, useState } from "react";
import { useStore } from "../store";
import { navigate as nav } from "../App";
import { Api } from "../api";
import { LoadingSpinner } from "@agentic/shared-ui";

const CITIES = ["Pune", "Mumbai", "Bengaluru", "Hyderabad", "Delhi"];

export default function MovieDiscovery({ showCitySelector = true }: { showCitySelector?: boolean }) {
  const { draft, setDraft } = useStore();
  const [cityInput, setCityInput] = useState(draft.city);
  const [cityError, setCityError] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(0);
  const [cityConfirmed, setCityConfirmed] = useState(draft.city);
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("all");
  const [language, setLanguage] = useState("all");
  const [format, setFormat] = useState("all");

  const filteredCities = CITIES.filter((c) => c.toLowerCase().includes(cityInput.toLowerCase()));

  useEffect(() => {
    setCityInput(draft.city);
    setCityConfirmed(draft.city);
  }, [draft.city]);

  async function loadMovies(city: string) {
    setLoading(true);
    try {
      const data = await Api.movies({ city, q: search, genre, language, format });
      setMovies(data.movies ?? []);
    } catch {
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMovies(cityConfirmed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityConfirmed, search, genre, language, format]);

  function confirmCity() {
    if (!cityInput.trim()) {
      setCityError("This field is required");
      return;
    }
    setCityError(null);
    const chosen = filteredCities[highlight] ?? cityInput;
    const finalCity = CITIES.includes(chosen) ? chosen : cityInput;
    const resolved = CITIES.find((c) => c.toLowerCase() === finalCity.toLowerCase()) ?? CITIES[0] ?? "Pune";
    setDraft((prev) => ({ ...prev, city: resolved, movieId: null, showtimeId: null, selectedSeats: [], holdId: null }));
    setCityConfirmed(resolved);
    setCityInput(resolved);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filteredCities.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      confirmCity();
    }
  }

  return (
    <div>
      {showCitySelector && (
        <div className="card" data-testid="movie-city-selector">
          <h2>Select City</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              data-testid="movie-city-input"
              value={cityInput}
              onChange={(e) => {
                setCityInput(e.target.value);
                setHighlight(0);
                setCityError(null);
              }}
              onKeyDown={handleKeyDown}
              aria-label="City"
              style={{ maxWidth: 260 }}
            />
            {cityError && <span className="error" role="alert">{cityError}</span>}
            <button className="btn" data-testid="movie-city-confirm" onClick={confirmCity}>
              Confirm City
            </button>
            <span>Current city: {cityConfirmed}</span>
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
            {filteredCities.map((c, i) => (
              <button
                key={c}
                type="button"
                data-testid="movie-city-option"
                onClick={() => {
                  setCityInput(c);
                  setHighlight(i);
                }}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: i === highlight ? "2px solid var(--accent)" : "1px solid var(--border)",
                  background: cityInput === c ? "var(--accent)" : "var(--card)",
                  color: cityInput === c ? "#111" : "var(--text)",
                  cursor: "pointer",
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2>Movies {cityConfirmed ? `in ${cityConfirmed}` : ""}</h2>
        <div className="grid grid-3">
          <label>
            Search
            <input data-testid="movie-search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title" />
          </label>
          <label>
            Genre
            <select data-testid="movie-genre-filter" value={genre} onChange={(e) => setGenre(e.target.value)}>
              <option value="all">All genres</option>
              {Array.from(new Set(movies.map((m) => m.genre))).map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
              {movies.length === 0 && (
                <>
                  <option value="Action">Action</option>
                  <option value="Comedy">Comedy</option>
                </>
              )}
            </select>
          </label>
          <label>
            Language
            <select data-testid="movie-language-filter" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="all">All languages</option>
              {Array.from(new Set(movies.map((m) => m.language))).map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </label>
          <label>
            Format
            <select data-testid="movie-format-filter" value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="all">All formats</option>
              <option value="2D">2D</option>
              <option value="3D">3D</option>
              <option value="IMAX">IMAX</option>
            </select>
          </label>
        </div>
      </div>

      {loading && <LoadingSpinner label="Loading movies" />}

      <div className="movie-grid" data-testid="movie-list">
        {movies.map((m) => (
          <div key={m.id} className="movie-card" data-testid="movie-card">
            <div className="poster" style={{ background: m.posterGradient }}>
              <span>{m.initials}</span>
            </div>
            <div className="movie-body">
              <div data-testid="movie-title" style={{ fontWeight: 700, fontSize: 16 }}>{m.title}</div>
              <div style={{ margin: "6px 0" }}>
                <span className="chip">{m.genre}</span>
                <span className="chip">{m.language}</span>
                <span className="chip">{m.runtime} min</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{m.classification} • {m.rating}/10</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{m.formats.join(", ")}</div>
              <div style={{ fontSize: 12, color: m.hasShows ? "var(--success)" : "var(--danger)", marginTop: 4 }}>
                {m.hasShows ? `${m.showCount} show(s)` : "No shows in this city"}
              </div>
              <button
                className="btn"
                style={{ marginTop: 8 }}
                data-testid="movie-view-details"
                onClick={() => {
                  setDraft((prev) => ({ ...prev, movieId: m.id }));
                  nav(`/movies/${m.id}`);
                }}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
      {movies.length === 0 && !loading && <p data-testid="no-movies">No movies available.</p>}
    </div>
  );
}
