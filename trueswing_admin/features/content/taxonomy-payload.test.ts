import { describe, expect, it } from "vitest";

import type { AdminTaxonomyTerm } from "@/lib/content/types";

import {
  draftFromTerm,
  emptyTermDraft,
  normalizeKey,
  termWarning,
  toCreateBody,
  toUpdateBody,
  validateTermDraft,
  type TermDraft,
} from "./taxonomy-payload";

const draft = (over: Partial<TermDraft> = {}): TermDraft => ({
  ...emptyTermDraft("PUTTING"),
  key: "LEAVES_SHORT",
  label: "Leaves short",
  golferLabel: "I leave them short",
  blurb: "Never gets to the hole",
  sort: "3",
  ...over,
});

describe("normalizeKey", () => {
  it("upper-cases and joins words the way the backend does", () => {
    expect(normalizeKey(" leaves short ")).toBe("LEAVES_SHORT");
    expect(normalizeKey("up-and-down")).toBe("UP_AND_DOWN");
  });

  it("collapses runs of separators so a stray double space is not a new key", () => {
    expect(normalizeKey("three  putt")).toBe("THREE_PUTT");
  });
});

describe("validateTermDraft", () => {
  it("accepts a filled-in miss", () => {
    expect(validateTermDraft(draft(), "misses")).toBeUndefined();
  });

  it("rejects a key that normalizes to nothing", () => {
    expect(validateTermDraft(draft({ key: "   " }), "misses")).toMatch(/needs a key/);
  });

  it("requires both the coach label and the golfer wording", () => {
    expect(validateTermDraft(draft({ label: "" }), "misses")).toMatch(/admin view/);
    expect(validateTermDraft(draft({ golferLabel: "" }), "misses")).toMatch(/golfer reads/);
  });

  it("requires an area on a miss — a putt is not sliced", () => {
    expect(validateTermDraft(draft({ area: "" }), "misses")).toMatch(/belong to an area/);
  });

  it("does not ask an area of a goal or an area", () => {
    expect(validateTermDraft(draft({ area: "" }), "goals")).toBeUndefined();
    expect(validateTermDraft(draft({ area: "" }), "areas")).toBeUndefined();
  });

  it("rejects a non-numeric sort", () => {
    expect(validateTermDraft(draft({ sort: "first" }), "goals")).toMatch(/number/);
  });

  it("allows an empty sort, which defaults to 0", () => {
    expect(validateTermDraft(draft({ sort: "" }), "goals")).toBeUndefined();
  });
});

describe("termWarning", () => {
  it("nudges for a subtitle on a miss without blocking the save", () => {
    expect(termWarning(draft({ blurb: "" }), "misses")).toMatch(/subtitle/i);
    expect(validateTermDraft(draft({ blurb: "" }), "misses")).toBeUndefined();
  });

  it("stays quiet for goals, whose labels stand alone", () => {
    expect(termWarning(draft({ blurb: "" }), "goals")).toBeUndefined();
  });
});

describe("bodies", () => {
  it("sends a normalized key and a numeric sort on create", () => {
    expect(toCreateBody(draft({ key: "leaves short" }), "misses")).toEqual({
      key: "LEAVES_SHORT",
      label: "Leaves short",
      golfer_label: "I leave them short",
      blurb: "Never gets to the hole",
      sort: 3,
      area: "PUTTING",
    });
  });

  it("sends a null blurb rather than an empty string", () => {
    expect(toCreateBody(draft({ blurb: "  " }), "goals").blurb).toBeNull();
  });

  it("omits area for goals and areas", () => {
    expect(toCreateBody(draft(), "goals")).not.toHaveProperty("area");
  });

  it("never sends key on update — issues reference it", () => {
    expect(toUpdateBody(draft(), "misses")).not.toHaveProperty("key");
  });
});

describe("draftFromTerm", () => {
  it("round-trips a term, turning a null blurb into an empty field", () => {
    const term: AdminTaxonomyTerm = {
      key: "CHUNK",
      label: "Chunk",
      golfer_label: "I chunk it",
      blurb: null,
      sort: 2,
      active: true,
      area: "CHIPPING",
      usage_count: 4,
    };
    expect(draftFromTerm(term)).toEqual({
      key: "CHUNK",
      label: "Chunk",
      golferLabel: "I chunk it",
      blurb: "",
      sort: "2",
      area: "CHIPPING",
    });
  });
});
