import type { ComposeIssueBody, DraftDrill } from "@/lib/content/types";

/** Everything the wizard tracks. Kept separate from the request body so the form
 * can hold half-finished drill rows the payload builder then filters out. */
export interface WizardState {
  title: string;
  description: string;
  area: string;
  kind: string;
  laymanTitle: string;
  laymanDesc: string;
  currentMotion: string;
  expectedMotion: string;
  swingEffect: string;
  shotOutcome: string;
  misses: string[];
  goals: string[];
  newDrills: DraftDrill[];
  existingDrillIds: string[];
}

export function emptyWizardState(defaults: {
  area: string;
  kind: string;
}): WizardState {
  return {
    title: "",
    description: "",
    area: defaults.area,
    kind: defaults.kind,
    laymanTitle: "",
    laymanDesc: "",
    currentMotion: "",
    expectedMotion: "",
    swingEffect: "",
    shotOutcome: "",
    misses: [],
    goals: [],
    newDrills: [],
    existingDrillIds: [],
  };
}

/** A drill row the user has actually filled in. Blank rows are scaffolding, not
 * content, and must not reach the API — the backend requires all four fields. */
export function isCompleteDrill(drill: DraftDrill): boolean {
  return Boolean(
    drill.title.trim() &&
      drill.task.trim() &&
      drill.success_signal.trim() &&
      drill.fault_indicator.trim(),
  );
}

/** True when a drill row has been touched but isn't finished — the wizard blocks
 * saving on this rather than silently dropping the half-written drill. */
export function isPartialDrill(drill: DraftDrill): boolean {
  const values = [
    drill.title,
    drill.task,
    drill.success_signal,
    drill.fault_indicator,
  ].map((v) => v.trim());
  return values.some(Boolean) && !values.every(Boolean);
}

/** Optional text field: send null rather than "" so the column stays NULL instead
 * of holding an empty string that reads as "set but blank". */
const orNull = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

export function toComposeBody(state: WizardState): ComposeIssueBody {
  return {
    title: state.title.trim(),
    description: state.description.trim(),
    area: state.area,
    kind: state.kind,
    layman_title: orNull(state.laymanTitle),
    layman_desc: orNull(state.laymanDesc),
    current_motion: orNull(state.currentMotion),
    expected_motion: orNull(state.expectedMotion),
    swing_effect: orNull(state.swingEffect),
    shot_outcome: orNull(state.shotOutcome),
    misses: state.misses,
    goals: state.goals,
    new_drills: state.newDrills.filter(isCompleteDrill),
    existing_drill_ids: state.existingDrillIds,
  };
}

/** Why the save button is disabled, or undefined when it's ready.
 *
 * Returned as copy rather than a boolean so the button can explain itself instead
 * of being mysteriously inert.
 */
export function validateWizard(state: WizardState): string | undefined {
  if (!state.title.trim()) return "An issue needs a title.";
  if (state.newDrills.some(isPartialDrill)) {
    return "Finish or remove the incomplete drill — all four fields are required.";
  }
  return undefined;
}

/** A non-blocking caution: an issue with no drills is valid but unpractisable, and
 * shows up in the coverage page's issues-with-no-drills count. */
export function wizardWarning(state: WizardState): string | undefined {
  const drills =
    state.newDrills.filter(isCompleteDrill).length + state.existingDrillIds.length;
  if (drills === 0) {
    return "No drills attached — a golfer can start this issue but has nothing to practise.";
  }
  if (state.misses.length === 0 && state.goals.length === 0) {
    return "No tags — this issue won't surface in the golfer's goal-first library.";
  }
  return undefined;
}

/** True when the form differs from where it started, for the navigate-away guard. */
export function isDirty(current: WizardState, initial: WizardState): boolean {
  return JSON.stringify(current) !== JSON.stringify(initial);
}
