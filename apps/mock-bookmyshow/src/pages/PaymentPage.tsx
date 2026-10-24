import React, { useEffect, useState } from "react";
import { useStore } from "../store";
import { navigate } from "../App";
import { Api } from "../api";

const CONVENIENCE_FEE = 40;

export default function PaymentPage() {
  const { draft, setDraft, sessionId } = useStore();
  const [contact, setContact] = useState(draft.contact);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!draft.showtimeId || !draft.holdId) {
      navigate("/review");
    }
  }, [draft.showtimeId, draft.holdId]);

  const ticketSubtotal = draft.selectedSeats.reduce((s, x) => s + x.price, 0);
  const foodSubtotal = draft.food.reduce((s, f) => s + f.price * f.quantity, 0);
  const total = ticketSubtotal + CONVENIENCE_FEE + foodSubtotal;

  async function handleUserPayment(outcome: "success" | "failed") {
    setError(null);
    if (!contact.name || !contact.email || !contact.phone) {
      setError("Please fill contact details.");
      return;
    }

    if (outcome === "failed") {
      setError("Payment was declined/cancelled by user. Please try again or cancel.");
      return;
    }

    setProcessing(true);
    try {
      const h = await Api.getHold(draft.holdId!);
      if (h.expired) {
        setError("Seat hold expired. Please reselect seats.");
        navigate("/seats");
        return;
      }

      const res = await Api.createBooking({
        holdId: draft.holdId,
        sessionId,
        contact,
        paymentMethod: "UPI-QR",
        paymentOutcome: "success",
        food: draft.food,
        convenienceFee: CONVENIENCE_FEE,
      });

      const booking = res.booking;
      setDraft((prev) => ({ ...prev, contact, paymentMethod: "UPI-QR", paymentOutcome: "success" }));
      navigate(`/confirmation/${booking.bookingId}`);
    } catch (e: any) {
      setError(e?.data?.message || e?.message || "Payment failed");
    } finally {
      setProcessing(false);
    }
  }

  // Generate SVG QR Code URL using quickchart QR API with dynamic amount
  const qrData = encodeURIComponent(`upi://pay?pa=mockbms@upi&pn=BookMyShowMock&am=${total}&cu=INR`);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${qrData}`;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div className="card" style={{ textAlign: "center" }}>
        <h1>Scan & Pay to Book Tickets</h1>
        <p style={{ fontSize: 16, color: "var(--muted)", margin: "4px 0" }}>
          Scan this Dummy QR Code using any UPI App
        </p>
        <div style={{ fontSize: 28, fontWeight: 800, color: "var(--accent)", margin: "8px 0" }}>
          ₹{total}
        </div>
      </div>

      {/* QR Code Card */}
      <div
        className="card"
        data-testid="payment-qr-container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "#ffffff",
          color: "#111827",
          padding: 24,
          borderRadius: 16,
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: "#1f2937" }}>
          UPI QR CODE
        </div>

        <div
          style={{
            padding: 12,
            background: "#fff",
            border: "2px dashed #6366f1",
            borderRadius: 12,
            display: "inline-block",
          }}
        >
          <img
            src={qrCodeUrl}
            alt="Payment QR Code"
            width={180}
            height={180}
            style={{ display: "block" }}
            data-testid="dummy-qr-code"
          />
        </div>

        <div style={{ marginTop: 12, fontSize: 13, color: "#6b7280", textAlign: "center" }}>
          Accepted: Google Pay, PhonePe, Paytm, BHIM UPI
        </div>

        {/* User Decision Buttons */}
        <div style={{ marginTop: 24, width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", textAlign: "center" }}>
            👤 Real User Action: Click your payment result below
          </div>

          <button
            type="button"
            className="btn"
            data-testid="btn-payment-success"
            disabled={processing}
            onClick={() => handleUserPayment("success")}
            style={{
              background: "#10b981",
              color: "#ffffff",
              fontSize: 16,
              fontWeight: 700,
              padding: "12px 20px",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)",
            }}
          >
            {processing ? "Confirming Booking..." : "✅ Payment Successful"}
          </button>

          <button
            type="button"
            className="btn secondary"
            data-testid="btn-payment-failure"
            disabled={processing}
            onClick={() => handleUserPayment("failed")}
            style={{
              background: "#fee2e2",
              color: "#ef4444",
              border: "1px solid #fca5a5",
              fontSize: 14,
              fontWeight: 600,
              padding: "10px 16px",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            ❌ Payment Failed / Cancel
          </button>
        </div>
      </div>

      {error && (
        <div
          className="card"
          data-testid="payment-error-msg"
          style={{ color: "#ef4444", border: "1px solid #ef4444", background: "rgba(239,68,68,0.1)", textAlign: "center" }}
        >
          {error}
        </div>
      )}

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Passenger / Contact Details</h3>
        <label>
          Name
          <input
            value={contact.name}
            onChange={(e) => setContact({ ...contact, name: e.target.value })}
            placeholder="Full Name"
          />
        </label>
        <label>
          Email
          <input
            value={contact.email}
            onChange={(e) => setContact({ ...contact, email: e.target.value })}
            placeholder="Email"
          />
        </label>
        <label>
          Phone
          <input
            value={contact.phone}
            onChange={(e) => setContact({ ...contact, phone: e.target.value })}
            placeholder="Phone"
          />
        </label>
      </div>
    </div>
  );
}
