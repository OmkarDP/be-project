import React, { useEffect, useState, useRef } from "react";
import { useStore } from "../store";
import { navigate } from "../App";
import { Api } from "../api";

const CATEGORY_LABEL: Record<string, string> = {};

export default function SeatsPage() {
  const { draft, setDraft, sessionId } = useStore();
  const [seats, setSeats] = useState<any[]>([]);
  const [showtime, setShowtime] = useState<any>(null);
  const [ticketCount, setTicketCount] = useState<number>(draft.ticketCount || 2);
  const [selected, setSelected] = useState<string[]>(draft.selectedSeats.map((s) => s.id));
  const [holdId, setHoldId] = useState<string | null>(draft.holdId);
  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(draft.holdExpiresAt);
  const [remaining, setRemaining] = useState<number>(0);
  const [expired, setExpired] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const creatingRef = useRef(false);

  useEffect(() => {
    if (!draft.showtimeId) {
      navigate("/shows");
    }
  }, [draft.showtimeId]);

  // load showtime info + seats
  useEffect(() => {
    async function load() {
      if (!draft.showtimeId) return;
      setLoading(true);
      try {
        // find showtime details
        const data = await Api.showtimes({ movieId: draft.movieId ?? "", city: draft.city });
        const st = (data.showtimes ?? []).find((x: any) => x.id === draft.showtimeId);
        setShowtime(st ?? null);
        const seatData = await Api.seats(draft.showtimeId, sessionId);
        setSeats(seatData.seats ?? []);
      } catch {
        setSeats([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [draft.showtimeId, draft.movieId, draft.city, sessionId]);

  // sync ticket count
  useEffect(() => {
    setDraft((prev) => ({ ...prev, ticketCount }));
  }, [ticketCount, setDraft]);

  // when selected changes, trim to ticket count
  useEffect(() => {
    if (selected.length > ticketCount) {
      setSelected((prev) => prev.slice(0, ticketCount));
    }
  }, [ticketCount, selected.length]);

  // create/update hold when selected reaches ticket count
  useEffect(() => {
    async function makeHold() {
      if (!draft.showtimeId) return;
      if (selected.length !== ticketCount || ticketCount === 0) return;
      if (creatingRef.current) return;
      creatingRef.current = true;
      setConflict(null);
      try {
        const res = await Api.createHold({
          showtimeId: draft.showtimeId,
          seats: selected,
          sessionId,
          ticketCount,
          holdDurationMs: undefined,
        });
        setHoldId(res.holdId);
        setHoldExpiresAt(res.expiresAt);
        setExpired(false);
        setDraft((prev) => ({ ...prev, selectedSeats: selected.map((id) => seatObj(id)), holdId: res.holdId, holdExpiresAt: res.expiresAt }));
      } catch (e: any) {
        const cs = e?.data?.conflictSeats;
        if (cs) {
          setConflict("Some selected seats are no longer available. Please choose again.");
          setSelected((prev) => prev.filter((id) => !cs.includes(id)));
        } else {
          setConflict(e?.message || "Could not hold seats");
        }
        setHoldId(null);
        setHoldExpiresAt(null);
      } finally {
        creatingRef.current = false;
      }
    }
    makeHold();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected.join(","), ticketCount]);

  function seatObj(id: string) {
    const s = seats.find((x) => x.id === id);
    return { id, row: s?.row ?? id[0], number: s?.number ?? 0, category: s?.category ?? "Silver", price: s?.price ?? 0 };
  }

  // countdown
  useEffect(() => {
    if (!holdExpiresAt) return;
    const interval = setInterval(() => {
      const rem = Math.max(0, holdExpiresAt - Date.now());
      setRemaining(rem);
      if (rem <= 0) {
        setExpired(true);
        setHoldId(null);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [holdExpiresAt]);

  // poll hold status
  useEffect(() => {
    if (!holdId) return;
    const interval = setInterval(async () => {
      try {
        const h = await Api.getHold(holdId);
        if (h.expired) {
          setExpired(true);
          setHoldId(null);
          setHoldExpiresAt(null);
        } else {
          setHoldExpiresAt(h.expiresAt);
        }
      } catch {
        // ignore
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [holdId]);

  // sync draft selected seats
  useEffect(() => {
    setDraft((prev) => ({ ...prev, selectedSeats: selected.map((id) => seatObj(id)), ticketCount }));
  }, [selected, seats, ticketCount, setDraft]);

  function toggleSeat(id: string, status: string) {
    if (status !== "available") return;
    setConflict(null);
    setExpired(false);
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= ticketCount) return prev;
      return [...prev, id];
    });
    // clear hold if selection changes
    if (holdId) {
      Api.releaseHold(holdId).catch(() => {});
      setHoldId(null);
      setHoldExpiresAt(null);
    }
  }

  function clearSeats() {
    setSelected([]);
    if (holdId) {
      Api.releaseHold(holdId).catch(() => {});
      setHoldId(null);
      setHoldExpiresAt(null);
    }
    setExpired(false);
    setConflict(null);
  }

  const total = selected.reduce((sum, id) => {
    const s = seats.find((x) => x.id === id);
    return sum + (s?.price ?? 0);
  }, 0);

  // group seats by row
  const rows: Record<string, any[]> = {};
  for (const s of seats) {
    if (!rows[s.row]) rows[s.row] = [];
    rows[s.row]!.push(s);
  }
  const rowKeys = Object.keys(rows).sort();

  const canContinue = selected.length === ticketCount && ticketCount > 0 && holdId !== null && !expired;

  return (
    <div>
      <div className="card">
        <h1>Seat Selection</h1>
        {showtime && (
          <p>{showtime.movieTitle} • {showtime.cinemaName} • {showtime.date} {showtime.time} • {showtime.format}</p>
        )}
      </div>

      <div className="card">
        <label>
          Ticket count
          <select
            data-testid="movie-ticket-count"
            value={ticketCount}
            onChange={(e) => {
              const n = Number(e.target.value);
              setTicketCount(n);
              clearSeats();
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>

      {loading && <div className="card">Loading seats...</div>}

      <div className="card">
        <div data-testid="movie-screen" className="screen">SCREEN</div>
        <div data-testid="movie-seat-map" className="seat-map">
          {rowKeys.map((row) => (
            <div key={row} className="seat-row" data-testid="movie-seat-row">
              <span className="row-label">{row}</span>
              {(rows[row] ?? [])
                .sort((a, b) => a.number - b.number)
                .map((s) => {
                  const isSelected = selected.includes(s.id);
                  const state = s.status === "unavailable" ? "unavailable" : isSelected ? "selected" : "available";
                  const testId = state === "selected" ? "movie-seat-selected" : state === "unavailable" ? "movie-seat-unavailable" : "movie-seat-available";
                  return (
                    <button
                      key={s.id}
                      data-testid={testId}
                      className={`seat ${state}`}
                      disabled={state === "unavailable"}
                      aria-label={`${s.category} row ${s.row} seat ${s.number}, ₹${s.price}, ${state}`}
                      onClick={() => toggleSeat(s.id, s.status)}
                    >
                      <span data-testid="movie-seat" style={{ display: "none" }} />
                      {s.number}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
        <div className="legend">
          <span><i style={{ background: "#14532d" }} /> Available</span>
          <span><i style={{ background: "var(--accent)" }} /> Selected</span>
          <span><i style={{ background: "#3f1d1d" }} /> Unavailable</span>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)" }}>
          Categories:{" "}
          {Array.from(new Set(seats.map((s) => s.category))).map((c) => (
            <span key={c} className="chip" data-testid="movie-seat-category">{c}</span>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Selected Seats</h3>
        <div data-testid="movie-selected-seat-list">
          {selected.length === 0 && <p>No seats selected.</p>}
          {selected.map((id) => {
            const s = seats.find((x) => x.id === id);
            return (
              <div key={id}>
                {s?.category} Row {s?.row} Seat {s?.number} — ₹{s?.price}
              </div>
            );
          })}
        </div>
        <div data-testid="movie-seat-total" style={{ fontWeight: 700, marginTop: 8 }}>
          Total: ₹{total}
        </div>
        <button className="btn danger" data-testid="movie-clear-seats" onClick={clearSeats} style={{ marginTop: 8 }}>
          Clear Seats
        </button>
      </div>

      <div className="card">
        <div data-testid="movie-seat-hold-status">
          {expired && <div data-testid="movie-seat-hold-expired" style={{ color: "var(--danger)" }}>Seat hold expired. Please reselect seats.</div>}
          {holdId && !expired && (
            <div>
              Hold active
              <span data-testid="movie-seat-hold-countdown" className="countdown" style={{ marginLeft: 8 }}>
                {Math.ceil(remaining / 1000)}s
              </span>
            </div>
          )}
          {!holdId && !expired && selected.length > 0 && selected.length < ticketCount && (
            <div>Select {ticketCount - selected.length} more seat(s).</div>
          )}
        </div>
        {conflict && <div data-testid="movie-seat-conflict-error" style={{ color: "var(--danger)", marginTop: 8 }}>{conflict}</div>}
        {expired && (
          <button
            className="btn"
            data-testid="movie-reselect-seats"
            onClick={() => {
              setExpired(false);
              clearSeats();
            }}
            style={{ marginTop: 8 }}
          >
            Reselect Seats
          </button>
        )}
      </div>

      <button
        className="btn"
        data-testid="movie-continue-to-review"
        disabled={!canContinue}
        onClick={() => {
          setDraft((prev) => ({
            ...prev,
            selectedSeats: selected.map((id) => seatObj(id)),
            holdId,
            holdExpiresAt,
            ticketCount,
          }));
          navigate("/review");
        }}
      >
        Continue to Review
      </button>
    </div>
  );
}
