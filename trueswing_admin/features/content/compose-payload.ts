import type {
  AdminIssue,
  ComposeIssueBody,
  DraftDrill,
  UpdateIssueBody,
} from "@/lib/content/types";

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

/**
 * How a blank optional field is expressed: `null` on create, `""` on edit.
 *
 * Load-bearing. On PATCH the backend reads null as "field absent" and leaves the old
 * value, so null for a cleared field would report success and change nothing.
 */
const blankAs = (value: string, empty: null | "") => value.trim() || empty;

/** The fields create and edit share, mapped once so the two bodies cannot drift. */
function commonFields(state: WizardState, empty: null | "") {
  return {
    title: state.title.trim(),
    description: state.description.trim(),
    area: state.area,
    kind: state.kind,
    layman_title: blankAs(state.laymanTitle, empty),
    layman_desc: blankAs(state.laymanDesc, empty),
    current_motion: blankAs(state.currentMotion, empty),
    expected_motion: blankAs(state.expectedMotion, empty),
    swing_effect: blankAs(state.swingEffect, empty),
    shot_outcome: blankAs(state.shotOutcome, empty),
    misses: state.misses,
    goals: state.goals,
  };
}

/** Seed the wizard from an existing issue, for edit mode. */
export function stateFromIssue(issue: AdminIssue): WizardState {
  return {
    title: issue.title ?? "",
    description: issue.description ?? "",
    area: issue.area,
    kind: issue.kind,
    laymanTitle: issue.layman_title ?? "",
    laymanDesc: issue.layman_desc ?? "",
    currentMotion: issue.current_motion ?? "",
    expectedMotion: issue.expected_motion ?? "",
    swingEffect: issue.swing_effect ?? "",
    shotOutcome: issue.shot_outcome ?? "",
    misses: [...issue.misses],
    goals: [...issue.goals],
    // Drills are attached and detached from the detail view, not through the form,
    // so edit mode carries none of its own.
    newDrills: [],
    existingDrillIds: [],
  };
}

/** Body for a partial edit. Blank optional text becomes "" so it clears. */
export function toUpdateBody(state: WizardState): UpdateIssueBody {
  return commonFields(state, "");
}

export function toComposeBody(state: WizardState): ComposeIssueBody {
  return {
    ...commonFields(state, null),
    new_drills: state.newDrills.filter(isCompleteDrill),
    existing_drill_ids: state.existingDrillIds,
  };
}

/** Why the save button is disabled, or undefined when it's ready. */
export function validateWizard(state: WizardState): string | undefined {
  if (!state.title.trim()) return "An issue needs a title.";
  if (state.newDrills.some(isPartialDrill)) {
    return "Finish or remove the incomplete drill — all four fields are required.";
  }
  return undefined;
}

/** A non-blocking caution: an issue with no drills is valid but unpractisable, and
 * shows up in the coverage page's issues-with-no-drills count. */
export function wizardWarning(
  state: WizardState,
  { existingDrillCount = 0 }: { existingDrillCount?: number } = {},
): string | undefined {
  // In edit mode the form holds no drills — they are attached from the detail view —
  // so the caller passes the issue's real count. Without it the warning would fire
  // on every edit, and a warning that cries wolf gets ignored along with the ones
  // that matter.
  const drills =
    state.newDrills.filter(isCompleteDrill).length +
    state.existingDrillIds.length +
    existingDrillCount;
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
