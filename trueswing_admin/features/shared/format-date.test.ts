import { describe, it, expect } from "vitest";
import { formatDateTime } from "./format-date";

describe("formatDateTime", () => {
  it("formats a full-precision ISO string to a short date+time", () => {
    const out = formatDateTime("2026-07-18T08:23:23.636190Z");
    // Locale/timezone-agnostic assertions: no raw ISO artifacts remain.
    expect(out).not.toBe("2026-07-18T08:23:23.636190Z");
    expect(out).not.toContain("T");
    expect(out).not.toContain("Z");
    expect(out).toMatch(/2026/);
    expect(out).not.toBe("Invalid Date");
  });

  it("returns — for null", () => {
    expect(formatDateTime(null)).toBe("—");
  });

  it("returns — for undefined", () => {
    expect(formatDateTime(undefined)).toBe("—");
  });

  it("returns — for empty string", () => {
    expect(formatDateTime("")).toBe("—");
  });

  it("returns — for an unparseable string", () => {
    expect(formatDateTime("not-a-date")).toBe("—");
  });
});
