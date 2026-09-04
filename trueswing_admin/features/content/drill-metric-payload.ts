/**
 * Pure helpers for the drill metric sub-form. Validation returns a reason string or
 * undefined, so the disabled save button can explain itself.
 *
 * The rules deliberately mirror `backend/core/services/drill_metrics.validate_metric`;
 * the server is authoritative, so if the two disagree this is the bug. See ADR-0009.
 */

/** Every field is a string because they all come from inputs. Coerced on the way out. */
export type MetricDraft = {
  /** "" means the drill is feel-only — the golfer rates the block, no number. */
  type: string;
  reps: string;
  label: string;
  unit: string;
  ceiling: string;
  dialed: string;
  ok: string;
};

/** Types the app can render an input for. Adding one here without also shipping its
 * input means an authored drill nobody can score. */
export const METRIC_TYPES = [
  ["", "Feel only — no number"],
  ["make_rate", "Make rate — how many out of N"],
  ["up_and_down", "Up and downs — how many out of N"],
  ["proximity", "Proximity — average distance"],
] as const;

const COUNTED = new Set(["make_rate", "up_and_down"]);

export const isCountedType = (type: string) => COUNTED.has(type);

/** Authoring defaults, matching `drill_metrics.DEFAULT_GRADE_AT` and the proximity ceiling. */
export const emptyMetricDraft = (): MetricDraft => ({
  type: "",
  reps: "10",
  label: "",
  unit: "ft",
  ceiling: "10",
  dialed: "0.8",
  ok: "0.5",
});

/** Read a drill's stored metric back into the form. Defensive: it is untyped JSONB. */
export function metricDraftFrom(metric: unknown): MetricDraft {
  const empty = emptyMetricDraft();
  if (!metric || typeof metric !== "object") return empty;

  const m = metric as Record<string, unknown>;
  const grade = (m.grade_at ?? {}) as Record<string, unknown>;
  const str = (v: unknown, fallback: string) =>
    v === undefined || v === null ? fallback : String(v);

  return {
    type: typeof m.type === "string" ? m.type : "",
    reps: str(m.reps, empty.reps),
    label: typeof m.label === "string" ? m.label : "",
    unit: str(m.unit, empty.unit),
    ceiling: str(m.ceiling, empty.ceiling),
    dialed: str(grade.dialed, empty.dialed),
    ok: str(grade.ok, empty.ok),
  };
}

const asNumber = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
};

/**
 * Why the save button is disabled, or undefined when it should be enabled.
 *
 * A feel-only drill (`type: ""`) validates trivially — that is the point of it.
 */
export function validateMetricDraft(draft: MetricDraft): string | undefined {
  if (draft.type === "") return undefined;

  if (!METRIC_TYPES.some(([key]) => key === draft.type)) {
    return `Unknown metric type "${draft.type}".`;
  }

  const reps = asNumber(draft.reps);
  if (reps === null || !Number.isInteger(reps)) {
    return "Reps has to be a whole number — how many attempts the golfer makes.";
  }
  if (reps < 1) return "A metric needs at least one rep.";

  const dialed = asNumber(draft.dialed);
  const ok = asNumber(draft.ok);
  for (const [name, value] of [
    ["Dialed", dialed],
    ["OK", ok],
  ] as const) {
    if (value === null) return `${name} has to be a number.`;
    // Proportions, not counts, so one threshold works at any rep count. 0.8 on a 10-rep
    // drill is 8; change reps to 20 and it becomes 16 with no re-authoring.
    if (value < 0 || value > 1) {
      return `${name} is a proportion between 0 and 1 (0.8 means 8 out of 10).`;
    }
  }
  if (ok! > dialed!) return "OK can't be a higher bar than Dialed.";

  if (draft.type === "proximity") {
    if (!draft.unit.trim()) {
      return "A proximity metric needs a unit, so the golfer knows what the number means.";
    }
    const ceiling = asNumber(draft.ceiling);
    if (ceiling === null || ceiling <= 0) {
      return "Ceiling has to be a positive number.";
    }
  }

  return undefined;
}

/**
 * The JSON to send, or null for a feel-only drill.
 *
 * Only call this on a draft that validates — it coerces without re-checking, the same
 * split compose-payload uses.
 */
export function metricFromDraft(draft: MetricDraft): Record<string, unknown> | null {
  if (draft.type === "") return null;

  const metric: Record<string, unknown> = {
    type: draft.type,
    reps: Number(draft.reps),
    grade_at: { dialed: Number(draft.dialed), ok: Number(draft.ok) },
  };

  if (draft.label.trim()) metric.label = draft.label.trim();

  if (draft.type === "proximity") {
    metric.unit = draft.unit.trim();
    metric.ceiling = Number(draft.ceiling);
    // Distance to the hole is the one metric where smaller wins. Sent explicitly rather
    // than inferred from the type, matching how the server stores it.
    metric.lower_is_better = true;
  }

  return metric;
}

/**
 * What the thresholds mean in the drill's own units, for the hint under the inputs.
 *
 * `grade_at` is the part an admin gets wrong: it reads like a score out of ten and is
 * actually a fraction, so the hint spells 0.8 out as "8 or more out of 10".
 */
export function thresholdHint(draft: MetricDraft): string | undefined {
  if (draft.type === "" || validateMetricDraft(draft)) return undefined;

  const reps = Number(draft.reps);
  const dialed = Number(draft.dialed);
  const ok = Number(draft.ok);

  if (isCountedType(draft.type)) {
    const dialedAt = Math.ceil(dialed * reps);
    const okAt = Math.ceil(ok * reps);
    return `Out of ${reps}: ${dialedAt} or more is dialed, ${okAt}-${dialedAt - 1} is ok, under ${okAt} is rough.`;
  }

  // Proximity is inverted: the score is how far *inside* the ceiling the golfer finished.
  const ceiling = Number(draft.ceiling);
  const unit = draft.unit.trim();
  const dialedAt = round1(ceiling * (1 - dialed));
  const okAt = round1(ceiling * (1 - ok));
  return `Inside ${dialedAt}${unit} is dialed, up to ${okAt}${unit} is ok, past that is rough.`;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
