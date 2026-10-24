import React from "react";

export interface ErrorAlertProps {
  message: string | null;
}

export function ErrorAlert({ message }: ErrorAlertProps): JSX.Element | null {
  if (!message) return null;
  return (
    <div role="alert" data-testid="error-alert" style={{ color: "#b00020", marginTop: 8, fontWeight: 600 }}>
      {message}
    </div>
  );
}