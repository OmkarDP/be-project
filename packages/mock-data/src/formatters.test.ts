import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate } from "./formatters";

describe("formatters", () => {
  it("formats INR currency", () => {
    expect(formatCurrency(1000)).toContain("1,000");
  });
  it("formats date", () => {
    expect(formatDate("2026-10-30")).toBeTruthy();
  });
});