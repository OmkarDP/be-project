import React, { useEffect, useState } from "react";
import { useStore } from "../store";
import { navigate } from "../App";
import { Api } from "../api";

export default function BookingsPage() {
  const { sessionId } = useStore();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await Api.listBookings(sessionId);
        setBookings(data.bookings ?? []);
      } catch {
        setBookings([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId]);

  return (
    <div>
      <div className="card">
        <h1>My Bookings</h1>
      </div>
      {loading && <div className="card">Loading...</div>}
      {bookings.length === 0 && !loading && <div className="card">No bookings yet.</div>}
      {bookings.map((b) => (
        <div key={b.bookingId} className="card">
          <strong>{b.bookingId}</strong> — {b.movieTitle} • {b.city} • {b.date} {b.time}
          <div>Seats: {b.seats.map((s: any) => `${s.row}${s.number}`).join(", ")}</div>
          <div>Total: ₹{b.total} • {b.status}</div>
          <button className="btn secondary" style={{ marginTop: 8 }} onClick={() => navigate(`/confirmation/${b.bookingId}`)}>
            View Ticket
          </button>
        </div>
      ))}
    </div>
  );
}
