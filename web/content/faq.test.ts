import { describe, it, expect } from "vitest";
import { FAQ } from "./faq";

describe("FAQ content", () => {
  it("has unique, slug-shaped ids", () => {
    // ids become DOM anchors and React keys, so duplicates break both.
    const ids = FAQ.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("has no empty questions or answers", () => {
    for (const item of FAQ) {
      expect(item.q.trim().length).toBeGreaterThan(0);
      expect(item.a.trim().length).toBeGreaterThan(0);
    }
  });

  it("does not lead with the AI claim the positioning avoids", () => {
    // The locked position is an adherence promise, not an accuracy promise.
    // The pre-pivot copy opened with "advanced AI analyses your swing" and
    // promised "a personal coach available 24/7". Neither should come back.
    const opener = FAQ[0].a.toLowerCase();
    expect(opener).not.toContain("advanced ai");
    expect(FAQ.some((f) => f.a.toLowerCase().includes("24/7"))).toBe(false);
  });

  it("does not claim desktop support", () => {
    // The product is an iOS app. The old FAQ said "desktop and mobile devices".
    const all = FAQ.map((f) => f.a.toLowerCase()).join(" ");
    expect(all).not.toContain("desktop");
  });
});
