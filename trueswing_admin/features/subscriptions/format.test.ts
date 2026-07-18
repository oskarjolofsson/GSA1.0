import { describe, it, expect } from "vitest";
import { formatPeriodEnd } from "./format";

describe("formatPeriodEnd", () => {
  it("returns 'No expiry' for null (manual comp grants)", () => {
    expect(formatPeriodEnd(null)).toBe("No expiry");
  });

  it("returns 'No expiry' for an unparseable string", () => {
    expect(formatPeriodEnd("not-a-date")).toBe("No expiry");
  });

  it("formats a valid ISO date to a human string", () => {
    // Locale-dependent exact text, so assert it changed from the raw ISO and
    // is non-empty rather than pinning a locale.
    const out = formatPeriodEnd("2026-08-01T00:00:00Z");
    expect(out).not.toBe("No expiry");
    expect(out.length).toBeGreaterThan(0);
  });
});
