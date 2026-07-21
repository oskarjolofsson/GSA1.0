import { describe, it, expect } from "vitest";
import { PRICING, PRICING_PUBLISHED } from "./pricing";

describe("pricing gate", () => {
  it("stays unpublished while the price is unconfirmed", () => {
    // These two must move together. If someone sets a real price but forgets
    // the flag (or vice versa) this catches the half-done state.
    expect(PRICING_PUBLISHED).toBe(PRICING.priceMinor !== null);
  });

  it("is currently unpublished", () => {
    // Delete this test when you publish. It exists to make publishing a
    // deliberate act rather than a drive-by edit.
    expect(PRICING_PUBLISHED).toBe(false);
    expect(PRICING.priceMinor).toBeNull();
  });
});

describe("pricing content", () => {
  it("has a name and at least three features", () => {
    expect(PRICING.name.trim().length).toBeGreaterThan(0);
    expect(PRICING.features.length).toBeGreaterThanOrEqual(3);
    for (const f of PRICING.features) {
      expect(f.trim().length).toBeGreaterThan(0);
    }
  });

  it("uses a valid currency and interval", () => {
    expect(["SEK", "EUR"]).toContain(PRICING.currency);
    expect(["month", "year"]).toContain(PRICING.interval);
  });
});
