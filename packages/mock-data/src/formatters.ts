import type { CurrencyCode } from "./types";

export function formatCurrency(amount: number, currency: CurrencyCode = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatTime(isoOrTime: string): string {
  if (isoOrTime.includes("T")) {
    const date = new Date(isoOrTime);
    if (Number.isNaN(date.getTime())) return isoOrTime;
    return new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).format(date);
  }
  return isoOrTime;
}

export function generateBookingId(platform: "irctc" | "redbus" | "bookmyshow"): string {
  const prefix = platform === "irctc" ? "IRCTC" : platform === "redbus" ? "RBUS" : "BMS";
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}-MOCK-${stamp}-${rand}`;
}