import React from "react";

export interface MockEnvironmentBannerProps {
  platform: string;
}

export function MockEnvironmentBanner({ platform }: MockEnvironmentBannerProps): JSX.Element {
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="mock-environment-banner"
      style={{
        background: "#b00020",
        color: "#ffffff",
        padding: "10px 16px",
        fontWeight: 700,
        textAlign: "center",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        letterSpacing: "0.04em",
      }}
    >
      MOCK TEST ENVIRONMENT — NO REAL BOOKINGS ({platform})
    </div>
  );
}