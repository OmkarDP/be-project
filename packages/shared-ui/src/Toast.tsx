import React from "react";

export interface ToastMessage {
  id: string;
  message: string;
  type?: "info" | "success" | "error";
}

export interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function Toast({ toasts, onDismiss }: ToastProps): JSX.Element {
  return (
    <div aria-live="assertive" style={{ position: "fixed", right: 16, bottom: 16, display: "grid", gap: 8, zIndex: 1100 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          data-testid="toast"
          style={{
            background: t.type === "error" ? "#ffebee" : t.type === "success" ? "#e8f5e9" : "#e3f2fd",
            color: "#222",
            border: "1px solid #ccc",
            padding: "10px 14px",
            borderRadius: 6,
            minWidth: 220,
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <span>{t.message}</span>
          <button type="button" onClick={() => onDismiss(t.id)} aria-label="Dismiss notification">
            x
          </button>
        </div>
      ))}
    </div>
  );
}