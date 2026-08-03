import { describe, expect, it } from "vitest";

import {
  emptyMetricDraft,
  metricDraftFrom,
  metricFromDraft,
  thresholdHint,
  validateMetricDraft,
  type MetricDraft,
} from "./drill-metric-payload";

const makeRate = (over: Partial<MetricDraft> = {}): MetricDraft => ({
  ...emptyMetricDraft(),
  type: "make_rate",
  ...over,
});

const proximity = (over: Partial<MetricDraft> = {}): MetricDraft => ({
  ...emptyMetricDraft(),
  type: "proximity",
  ...over,
});

describe("feel-only is the default", () => {
  it("validates with no type chosen", () => {
    // Most drills are still feel-only — mirror work has no number to record — so the
    // quiet state has to be the one that needs no thought.
    expect(validateMetricDraft(emptyMetricDraft())).toBeUndefined();
  });

  it("sends null rather than an empty metric object", () => {
    expect(metricFromDraft(emptyMetricDraft())).toBeNull();
  });
});

describe("validation mirrors the server", () => {
  it("accepts the pre-filled defaults once a type is chosen", () => {
    expect(validateMetricDraft(makeRate())).toBeUndefined();
  });

  it("rejects a fractional rep count", () => {
    expect(validateMetricDraft(makeRate({ reps: "10.5" }))).toMatch(/whole number/);
  });

  it("rejects zero reps", () => {
    expect(validateMetricDraft(makeRate({ reps: "0" }))).toMatch(/at least one rep/);
  });

  it("rejects a threshold written as a count instead of a proportion", () => {
    // The mistake this exists to catch: grade_at reads like a score out of ten and is
    // a fraction, so "8" means eight times a perfect score.
    expect(validateMetricDraft(makeRate({ dialed: "8" }))).toMatch(/proportion/);
  });

  it("rejects an ok bar set higher than the dialed bar", () => {
    expect(validateMetricDraft(makeRate({ dialed: "0.4", ok: "0.9" }))).toMatch(
      /higher bar/,
    );
  });

  it("rejects a blank threshold", () => {
    expect(validateMetricDraft(makeRate({ ok: "" }))).toMatch(/number/);
  });

  it("requires a unit on proximity, so the number means something", () => {
    expect(validateMetricDraft(proximity({ unit: "  " }))).toMatch(/unit/);
  });

  it("requires a positive ceiling", () => {
    expect(validateMetricDraft(proximity({ ceiling: "0" }))).toMatch(/positive/);
  });

  it("ignores unit and ceiling for a counted metric", () => {
    expect(validateMetricDraft(makeRate({ unit: "", ceiling: "0" }))).toBeUndefined();
  });
});

describe("the payload", () => {
  it("coerces the numbers and nests grade_at", () => {
    expect(metricFromDraft(makeRate({ reps: "20" }))).toEqual({
      type: "make_rate",
      reps: 20,
      grade_at: { dialed: 0.8, ok: 0.5 },
    });
  });

  it("omits a blank prompt rather than sending an empty string", () => {
    expect(metricFromDraft(makeRate())).not.toHaveProperty("label");
    expect(metricFromDraft(makeRate({ label: " Putts made " }))).toMatchObject({
      label: "Putts made",
    });
  });

  it("carries unit, ceiling and lower_is_better for proximity", () => {
    expect(metricFromDraft(proximity({ unit: " ft ", ceiling: "15" }))).toMatchObject({
      unit: "ft",
      ceiling: 15,
      lower_is_better: true,
    });
  });

  it("leaves unit and ceiling off a counted metric", () => {
    const payload = metricFromDraft(makeRate())!;
    expect(payload).not.toHaveProperty("unit");
    expect(payload).not.toHaveProperty("ceiling");
  });
});

describe("reading a stored metric back", () => {
  it("round-trips a counted metric", () => {
    const stored = metricFromDraft(makeRate({ reps: "20", label: "Putts made" }));
    expect(metricFromDraft(metricDraftFrom(stored))).toEqual(stored);
  });

  it("round-trips a proximity metric", () => {
    const stored = metricFromDraft(proximity({ ceiling: "15", unit: "m" }));
    expect(metricFromDraft(metricDraftFrom(stored))).toEqual(stored);
  });

  it("falls back to the empty draft for a feel-only drill", () => {
    expect(metricDraftFrom(null)).toEqual(emptyMetricDraft());
  });

  it("survives a metric that is not an object", () => {
    // drills.metric is JSONB and the app can be pointed at data this build never wrote.
    expect(metricDraftFrom("nonsense")).toEqual(emptyMetricDraft());
  });

  it("fills defaults for a metric missing its thresholds", () => {
    const draft = metricDraftFrom({ type: "make_rate", reps: 10 });
    expect(draft.dialed).toBe("0.8");
    expect(draft.ok).toBe("0.5");
  });
});

describe("the threshold hint", () => {
  it("spells a counted metric out in reps", () => {
    expect(thresholdHint(makeRate())).toBe(
      "Out of 10: 8 or more is dialed, 5-7 is ok, under 5 is rough.",
    );
  });

  it("rescales with the rep count, since the thresholds are proportions", () => {
    expect(thresholdHint(makeRate({ reps: "20" }))).toContain("Out of 20: 16 or more");
  });

  it("inverts for proximity, where closer wins", () => {
    expect(thresholdHint(proximity())).toBe(
      "Inside 2ft is dialed, up to 5ft is ok, past that is rough.",
    );
  });

  it("says nothing while the draft is invalid", () => {
    expect(thresholdHint(makeRate({ reps: "" }))).toBeUndefined();
    expect(thresholdHint(emptyMetricDraft())).toBeUndefined();
  });
});
