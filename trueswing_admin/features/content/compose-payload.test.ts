import { describe, expect, it } from "vitest";

import type { AdminIssue } from "@/lib/content/types";

import {
  emptyWizardState,
  isCompleteDrill,
  isDirty,
  isPartialDrill,
  stateFromIssue,
  toComposeBody,
  toUpdateBody,
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

describe("edit-mode helpers", () => {
  const issue = {
    id: "abc",
    title: "Early extension",
    description: "hips move toward the ball",
    area: "PITCHING",
    kind: "fault",
    source: "catalog",
    user_id: null,
    layman_title: "You stand up out of it",
    layman_desc: "Your hips drift toward the ball.",
    current_motion: "steep",
    expected_motion: "shallow",
    swing_effect: null,
    shot_outcome: null,
    created_at: "2026-01-01T00:00:00Z",
    goals: ["CONTACT"],
    misses: ["THIN", "FAT"],
    drills: [],
    drill_count: 0,
  } satisfies AdminIssue;

  describe("stateFromIssue", () => {
    it("carries every field across", () => {
      const state = stateFromIssue(issue);

      expect(state.title).toBe("Early extension");
      expect(state.area).toBe("PITCHING");
      expect(state.laymanTitle).toBe("You stand up out of it");
      expect(state.currentMotion).toBe("steep");
      expect(state.misses).toEqual(["THIN", "FAT"]);
      expect(state.goals).toEqual(["CONTACT"]);
    });

    it("turns nulls into empty strings so inputs stay controlled", () => {
      const state = stateFromIssue(issue);
      expect(state.swingEffect).toBe("");
      expect(state.shotOutcome).toBe("");
    });

    it("copies the tag arrays rather than aliasing the issue", () => {
      // Toggling a tag in the form must not mutate the object the list is showing.
      const state = stateFromIssue(issue);
      state.misses.push("SLICE");
      expect(issue.misses).toEqual(["THIN", "FAT"]);
    });

    it("carries no drills, since the form does not own them in edit mode", () => {
      const state = stateFromIssue(issue);
      expect(state.newDrills).toEqual([]);
      expect(state.existingDrillIds).toEqual([]);
    });
  });

  describe("toUpdateBody vs toComposeBody", () => {
    it("sends \"\" for a cleared field where create sends null", () => {
      // The whole point: on PATCH, null reads as "field absent" and leaves the old
      // value, so a cleared field has to travel as "".
      const state = { ...stateFromIssue(issue), laymanTitle: "   " };

      expect(toUpdateBody(state).layman_title).toBe("");
      expect(toComposeBody(state).layman_title).toBeNull();
    });

    it("trims and sends text identically in both", () => {
      const state = { ...stateFromIssue(issue), laymanTitle: "  Kept  " };

      expect(toUpdateBody(state).layman_title).toBe("Kept");
      expect(toComposeBody(state).layman_title).toBe("Kept");
    });

    it("always sends both tag arrays, so an emptied set clears", () => {
      const state = { ...stateFromIssue(issue), misses: [], goals: [] };

      expect(toUpdateBody(state).misses).toEqual([]);
      expect(toUpdateBody(state).goals).toEqual([]);
    });

    it("omits the drill fields, which the edit endpoint does not accept", () => {
      const body = toUpdateBody(stateFromIssue(issue));
      expect("new_drills" in body).toBe(false);
      expect("existing_drill_ids" in body).toBe(false);
    });
  });

  describe("wizardWarning with drills the form does not own", () => {
    it("stays quiet when the issue already has drills", () => {
      const state = { ...stateFromIssue(issue), misses: ["FAT"] };

      expect(wizardWarning(state, { existingDrillCount: 2 })).toBeUndefined();
    });

    it("still warns when the issue genuinely has none", () => {
      const state = { ...stateFromIssue(issue), misses: ["FAT"] };

      expect(wizardWarning(state, { existingDrillCount: 0 })).toMatch(
        /nothing to practise/i,
      );
    });

    it("still warns about missing tags even with drills attached", () => {
      const state = { ...stateFromIssue(issue), misses: [], goals: [] };

      expect(wizardWarning(state, { existingDrillCount: 3 })).toMatch(/won't surface/i);
    });
  });
});
