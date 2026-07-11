// Canonical goal vocabulary (WHY a golfer practices) — the top-level entry to the
// library. Mirrors the backend issue_goals CHECK constraint and core/services/taxonomy.py.

export type GoalKey = "STRAIGHTER" | "DISTANCE" | "CONTACT" | "BIG_MISS" | "SHORT_GAME" | "PUTTING";

export interface Goal {
    key: GoalKey;
    label: string;
    blurb: string;
}

export const GOALS: Goal[] = [
    { key: "STRAIGHTER", label: "Hit it straighter", blurb: "Control where the ball starts and curves" },
    { key: "DISTANCE", label: "More distance", blurb: "More speed and solid strikes for carry" },
    { key: "CONTACT", label: "Better contact", blurb: "Flush it off the middle of the face" },
    { key: "BIG_MISS", label: "Kill the big miss", blurb: "Stop the round-wrecking shot" },
    { key: "SHORT_GAME", label: "Sharper short game", blurb: "Chips, pitches and bunkers" },
    { key: "PUTTING", label: "Better putting", blurb: "Roll it on line, control the speed" },
];
