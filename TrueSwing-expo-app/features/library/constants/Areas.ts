// Canonical, ordered list of practice areas. Single source of truth for the
// Library's section order and display labels. Must stay in sync with the backend
// CHECK constraint on issues.area (FULL_SWING, SHORT_GAME, PUTTING, MENTAL).

export type AreaKey = "FULL_SWING" | "SHORT_GAME" | "PUTTING" | "MENTAL";

export interface Area {
    key: AreaKey;
    label: string;
}

export const AREAS: Area[] = [
    { key: "FULL_SWING", label: "Full swing" },
    { key: "SHORT_GAME", label: "Short game" },
    { key: "PUTTING", label: "Putting" },
    { key: "MENTAL", label: "Mental" },
];

/** The six swing phases, in swing order. Only meaningful for full-swing issues. */
export const PHASES = [
    "SETUP",
    "BACKSWING",
    "TRANSITION",
    "DOWNSWING",
    "IMPACT",
    "FOLLOW_THROUGH",
] as const;

export type PhaseKey = (typeof PHASES)[number];

/** "FOLLOW_THROUGH" -> "Follow through" for chip labels. */
export function phaseLabel(phase: string): string {
    const s = phase.replace(/_/g, " ").toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
}
