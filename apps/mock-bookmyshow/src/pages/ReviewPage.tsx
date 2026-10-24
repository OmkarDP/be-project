import React, { useEffect, useState } from "react";
import { useStore } from "../store";
import { navigate } from "../App";
import { Api } from "../api";

const CONVENIENCE_FEE = 40;

export default function ReviewPage() {
  const { draft, setDraft, sessionId } = useStore();
  const [holdValid, setHoldValid] = useState<boolean>(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showtime, setShowtime] = useState<any>(null);
  const [movieTitle, setMovieTitle] = useState<string>("");

  useEffect(() => {
    if (!draft.showtimeId || !draft.holdId) {
      navigate("/seats");
    }
  }, [draft.showtimeId, draft.holdId]);

  useEffect(() => {
    async function load() {
      if (!draft.showtimeId) return;
      try {
        const data = await Api.showtimes({ movieId: draft.movieId ?? "", city: draft.city });
        const st = (data.showtimes ?? []).find((x: any) => x.id === draft.showtimeId);
        setShowtime(st ?? null);
      } catch {
        // ignore
      }
      if (draft.movieId) {
        try {
          const m = await Api.movie(draft.movieId, draft.city);
          setMovieTitle(m.movie?.title ?? draft.movieId);
        } catch {
          setMovieTitle(draft.movieId ?? "");
        }
      }
    }
    load();
  }, [draft.showtimeId, draft.movieId, draft.city]);

  useEffect(() => {
    async function checkHold() {
      if (!draft.holdId) return;
      setChecking(true);
      try {
        const h = await Api.getHold(draft.holdId);
        if (h.expired || h.status !== "active") {
          setHoldValid(false);
          setError("Your seat hold has expired. Please reselect seats.");
        } else {
          setHoldValid(true);
          setError(null);
        }
      } catch {
        setHoldValid(false);
        setError("Could not verify seat hold.");
      } finally {
        setChecking(false);
      }
    }
    checkHold();
  }, [draft.holdId]);

  const ticketSubtotal = draft.selectedSeats.reduce((s, x) => s + x.price, 0);
  const foodSubtotal = draft.food.reduce((s, f) => s + f.price * f.quantity, 0);
  const total = ticketSubtotal + CONVENIENCE_FEE + foodSubtotal;

  function removeFood(id: string) {
    setDraft((prev) => ({ ...prev, food: prev.food.filter((f) => f.id !== id) }));
  }

  async function continueToPayment() {
    if (!draft.holdId) {
      navigate("/seats");
      return;
    }
    try {
      const h = await Api.getHold(draft.holdId);
      if (h.expired) {
        setHoldValid(false);
        setError("Your seat hold has expired. Please reselect seats.");
        navigate("/seats");
        return;
      }
      navigate("/payment");
    } catch {
      navigate("/seats");
    }
  }

  return (
    <div>
      <div className="card">
        <h1>Booking Review</h1>
      </div>
      {error && <div className="card" style={{ color: "var(--danger)" }}>{error}</div>}
      <div className="card">
        <div><strong>Movie:</strong> {movieTitle || draft.movieId}</div>
        <div><strong>City:</strong> {draft.city}</div>
        <div><strong>Cinema:</strong> {showtime?.cinemaName}</div>
        <div><strong>Date & Time:</strong> {showtime?.date} {showtime?.time}</div>
        <div><strong>Format:</strong> {showtime?.format}</div>
        <div><strong>Ticket count:</strong> {draft.ticketCount}</div>
        <div>
          <strong>Seats:</strong>{" "}
          {draft.selectedSeats.map((s) => `${s.category} ${s.row}${s.number}`).join(", ")}
        </div>
      </div>

      <div className="card">
        <h3>Food</h3>
        {draft.food.length === 0 && <p>No food selected. <button className="btn secondary" onClick={() => navigate("/food")}>Add snacks</button></p>}
        {draft.food.map((f) => (
          <div key={f.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span>{f.name} x {f.quantity}</span>
            <span>
              ₹{f.price * f.quantity}
              <button className="btn danger" style={{ marginLeft: 8 }} onClick={() => removeFood(f.id)}>Remove</button>
            </span>
          </div>
        ))}
      </div>

      <div className="card">
        <div>Ticket subtotal: ₹{ticketSubtotal}</div>
        <div>Convenience fee: ₹{CONVENIENCE_FEE}</div>
        <div>Food subtotal: ₹{foodSubtotal}</div>
        <div style={{ fontWeight: 700 }}>Total: ₹{total}</div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn secondary" onClick={() => navigate("/seats")}>Change Seats</button>
        <button className="btn secondary" onClick={() => navigate("/shows")}>Back to Showtimes</button>
        <button className="btn" disabled={!holdValid || checking} onClick={continueToPayment}>
          Continue to Payment
        </button>
      </div>
      {checking && <div>Verifying hold...</div>}
    </div>
  );
}
