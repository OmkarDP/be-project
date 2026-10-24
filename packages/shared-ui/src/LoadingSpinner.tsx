import React from "react";

export interface LoadingSpinnerProps {
  label?: string;
}

export function LoadingSpinner({ label = "Loading" }: LoadingSpinnerProps): JSX.Element {
  return (
    <div role="status" aria-live="polite" data-testid="loading-spinner" style={{ padding: 12 }}>
      <span className="spinner" aria-hidden="true" />
      <span style={{ marginLeft: 8 }}>{label}…</span>
    </div>
  );
}