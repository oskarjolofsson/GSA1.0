import { describe, expect, it } from "vitest";

import {
  emptyWizardState,
  isCompleteDrill,
  isDirty,
  isPartialDrill,
  toComposeBody,
  validateWizard,
  wizardWarning,
  type WizardState,
} from "./compose-payload";

const base = (): WizardState =>
  emptyWizardState({ area: "FULL_SWING", kind: "fault" });

const drill = (over: Partial<Record<string, string>> = {}) => ({
  title: "t",
  task: "t",
  success_signal: "s",
  fault_indicator: "f",
  ai_filled: [],
  ...over,
});

describe("drill completeness", () => {
  it("treats all four fields filled as complete", () => {
    expect(isCompleteDrill(drill())).toBe(true);
  });

  it("treats whitespace as empty", () => {
    expect(isCompleteDrill(drill({ task: "   " }))).toBe(false);
  });

  it("an untouched row is neither complete nor partial", () => {
    const blank = drill({ title: "", task: "", success_signal: "", fault_indicator: "" });
    expect(isCompleteDrill(blank)).toBe(false);
    expect(isPartialDrill(blank)).toBe(false);
  });

  it("a half-filled row is partial", () => {
    expect(isPartialDrill(drill({ fault_indicator: "" }))).toBe(true);
  });
});

describe("toComposeBody", () => {
  it("drops untouched drill rows rather than sending empty ones", () => {
    const state = {
      ...base(),
      title: "Early extension",
      newDrills: [
        drill(),
        drill({ title: "", task: "", success_signal: "", fault_indicator: "" }),
      ],
    };

    expect(toComposeBody(state).new_drills).toHaveLength(1);
  });

  it("sends null for blank optional text, not an empty string", () => {
    // "" would persist as a set-but-blank column, which reads differently from
    // "never filled in" when the app decides whether to show the fallback copy.
    const body = toComposeBody({ ...base(), title: "x", laymanTitle: "   " });

    expect(body.layman_title).toBeNull();
    expect(body.current_motion).toBeNull();
  });

  it("trims the title and passes tags through untouched", () => {
    const body = toComposeBody({
      ...base(),
      title: "  Casting  ",
      misses: ["SLICE", "PULL"],
      goals: ["STRAIGHTER"],
    });

    expect(body.title).toBe("Casting");
    expect(body.misses).toEqual(["SLICE", "PULL"]);
    expect(body.goals).toEqual(["STRAIGHTER"]);
  });

  it("carries existing drill ids separately from new drills", () => {
    const body = toComposeBody({
      ...base(),
      title: "x",
      existingDrillIds: ["abc"],
      newDrills: [drill()],
    });

    expect(body.existing_drill_ids).toEqual(["abc"]);
    expect(body.new_drills).toHaveLength(1);
  });
});

describe("validateWizard", () => {
  it("requires a title", () => {
    expect(validateWizard(base())).toMatch(/title/i);
    expect(validateWizard({ ...base(), title: "  " })).toMatch(/title/i);
  });

  it("blocks on a half-written drill instead of silently dropping it", () => {
    const state = {
      ...base(),
      title: "x",
      newDrills: [drill({ success_signal: "" })],
    };

    expect(validateWizard(state)).toMatch(/incomplete drill/i);
  });

  it("passes once the title is set and drills are whole", () => {
    expect(validateWizard({ ...base(), title: "x", newDrills: [drill()] })).toBeUndefined();
  });
});

describe("wizardWarning", () => {
  it("warns when nothing is attached to practise", () => {
    expect(wizardWarning({ ...base(), title: "x" })).toMatch(/nothing to practise/i);
  });

  it("counts an existing drill link as practisable", () => {
    const state = { ...base(), title: "x", existingDrillIds: ["abc"] };
    expect(wizardWarning(state)).not.toMatch(/nothing to practise/i);
  });

  it("warns when an issue has no tags, since the library is tag-driven", () => {
    const state = { ...base(), title: "x", newDrills: [drill()] };
    expect(wizardWarning(state)).toMatch(/won't surface/i);
  });

  it("is silent once there are both drills and tags", () => {
    const state = {
      ...base(),
      title: "x",
      newDrills: [drill()],
      misses: ["SLICE"],
    };
    expect(wizardWarning(state)).toBeUndefined();
  });
});

describe("isDirty", () => {
  it("is false for an untouched form", () => {
    const initial = base();
    expect(isDirty({ ...initial }, initial)).toBe(false);
  });

  it("notices a typed character", () => {
    const initial = base();
    expect(isDirty({ ...initial, title: "a" }, initial)).toBe(true);
  });

  it("notices a toggled tag", () => {
    const initial = base();
    expect(isDirty({ ...initial, misses: ["SLICE"] }, initial)).toBe(true);
  });
});
