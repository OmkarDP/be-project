import React, { useEffect, useState } from "react";
import { useStore } from "../store";
import { navigate } from "../App";
import { Api } from "../api";

export default function ConfirmationPage({ bookingId }: { bookingId: string }) {
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await Api.getBooking(bookingId);
        setBooking(data.booking);
      } catch (e: any) {
        setError(e?.message || "Booking not found");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [bookingId]);

  if (loading) return <div className="card">Loading...</div>;
  if (error || !booking) return <div className="card" style={{ color: "var(--danger)" }}>{error || "Booking not found"}</div>;

  return (
    <div>
      <div className="card">
        <h1>Booking Confirmed</h1>
        <div className="ticket-card">
          <div><strong>Booking ID:</strong> {booking.bookingId}</div>
          <div><strong>Status:</strong> {booking.status}</div>
          <div><strong>Movie:</strong> {booking.movieTitle}</div>
          <div><strong>Cinema:</strong> {booking.cinemaName}</div>
          <div><strong>City:</strong> {booking.city}</div>
          <div><strong>Date & Time:</strong> {booking.date} {booking.time}</div>
          <div><strong>Format:</strong> {booking.format}</div>
          <div><strong>Seats:</strong> {booking.seats.map((s: any) => `${s.category} ${s.row}${s.number}`).join(", ")}</div>
          <div><strong>Ticket count:</strong> {booking.ticketCount}</div>
          {booking.food?.length > 0 && (
            <div><strong>Food:</strong> {booking.food.map((f: any) => `${f.name} x${f.quantity}`).join(", ")}</div>
          )}
          <div><strong>Total:</strong> ₹{booking.total}</div>
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)" }}>Synthetic test identifier: {booking.bookingId} (not a real ticket)</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button
          className="btn"
          data-testid="btn-download-ticket"
          style={{ background: "#6366f1", fontWeight: 700 }}
          onClick={() => window.print()}
        >
          📥 Download / Print Ticket
        </button>
        <button className="btn secondary" onClick={() => navigate("/bookings")}>View All Bookings</button>
        <button className="btn secondary" onClick={() => navigate("/")}>Home</button>
      </div>
    </div>
  );
}
