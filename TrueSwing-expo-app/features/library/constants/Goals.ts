// Canonical goal vocabulary (WHY a golfer practices) — the top-level entry to the
// library. Mirrors the backend issue_goals CHECK constraint and core/services/taxonomy.py.
//
// A goal OWNS a fixed set of misses (its `misses`). Technical fault issues are tagged
// only with misses (issue_misses); the library derives which goal they sit under from
// this map, so goals stay plain-language groupings while issues stay technical.
// `issue_goals` is reserved for kind='skill' focuses, which have no miss and hang
// directly off a goal (e.g. a clubhead-speed protocol under DISTANCE).

import type { MissKey } from "./Misses";

export type GoalKey = "STRAIGHTER" | "DISTANCE" | "CONTACT" | "BIG_MISS" | "SHORT_GAME" | "PUTTING";

export interface Goal {
    key: GoalKey;
    label: string;
    blurb: string;
    /** Ball-flight misses that belong to this goal. A miss may belong to several. */
    misses: MissKey[];
}

export const GOALS: Goal[] = [
    { key: "STRAIGHTER", label: "Hit it straighter", blurb: "Control where the ball starts and curves",
      misses: ["SLICE", "HOOK", "PULL", "PUSH"] },
    { key: "DISTANCE", label: "More distance", blurb: "More speed and solid strikes for carry",
      misses: ["LOW_WEAK", "THIN", "TOP"] },
    { key: "CONTACT", label: "Better contact", blurb: "Flush it off the middle of the face",
      misses: ["FAT", "THIN", "TOP"] },
    { key: "BIG_MISS", label: "Kill the big miss", blurb: "Stop the round-wrecking shot",
      misses: ["SLICE", "HOOK"] },
    { key: "SHORT_GAME", label: "Sharper short game", blurb: "Chips, pitches and bunkers",
      misses: [] },
    { key: "PUTTING", label: "Better putting", blurb: "Roll it on line, control the speed",
      misses: [] },
];
