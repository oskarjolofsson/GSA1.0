import { describe, it, expect } from "vitest";
import { paginate, parsePage } from "./paginate";

describe("paginate", () => {
  it("first page of many: prev off, next on", () => {
    const p = paginate({ page: 1, total: 25, limit: 10, itemsOnPage: 10 });
    expect(p).toMatchObject({ offset: 0, pageCount: 3, hasPrev: false, hasNext: true });
  });

  it("middle page: both prev and next on", () => {
    const p = paginate({ page: 2, total: 25, limit: 10, itemsOnPage: 10 });
    expect(p).toMatchObject({ offset: 10, hasPrev: true, hasNext: true });
  });

  it("last (partial) page: next off", () => {
    const p = paginate({ page: 3, total: 25, limit: 10, itemsOnPage: 5 });
    expect(p).toMatchObject({ offset: 20, hasPrev: true, hasNext: false });
  });

  it("exactly one full page: no next", () => {
    const p = paginate({ page: 1, total: 10, limit: 10, itemsOnPage: 10 });
    expect(p).toMatchObject({ pageCount: 1, hasPrev: false, hasNext: false });
  });

  it("empty total: one page, no controls", () => {
    const p = paginate({ page: 1, total: 0, limit: 10, itemsOnPage: 0 });
    expect(p).toMatchObject({ pageCount: 1, hasPrev: false, hasNext: false });
  });

  it("out-of-range page past the end: prev on, next off", () => {
    const p = paginate({ page: 9, total: 25, limit: 10, itemsOnPage: 0 });
    expect(p).toMatchObject({ offset: 80, hasPrev: true, hasNext: false });
  });

  it("clamps page below 1 up to 1", () => {
    const p = paginate({ page: 0, total: 25, limit: 10 });
    expect(p.page).toBe(1);
    expect(p.offset).toBe(0);
  });

  it("defaults itemsOnPage to a full limit when omitted", () => {
    // Before the fetch we assume a full page, so next is on when more exist.
    expect(paginate({ page: 1, total: 25, limit: 10 }).hasNext).toBe(true);
  });
});

describe("parsePage", () => {
  it("parses a valid page", () => {
    expect(parsePage("3")).toBe(3);
  });

  it("takes the first value of an array param", () => {
    expect(parsePage(["2", "5"])).toBe(2);
  });

  it("falls back to 1 for undefined / junk / below-range", () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-4")).toBe(1);
  });
});
