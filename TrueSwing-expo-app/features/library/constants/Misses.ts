// Canonical ball-flight miss vocabulary (WHAT the golfer sees). Mirrors the backend
// issue_misses CHECK constraint and core/services/taxonomy.py. Plain-language labels
// are what a 12-handicap taps under "Which sounds like you?".

export type MissKey = "SLICE" | "HOOK" | "PULL" | "PUSH" | "TOP" | "THIN" | "FAT" | "LOW_WEAK";

export const MISS_LABELS: Record<MissKey, string> = {
    SLICE: "I slice it (curves hard right)",
    HOOK: "I hook it (curves hard left)",
    PULL: "I pull it (starts left, stays left)",
    PUSH: "I push it (starts right, stays right)",
    TOP: "I top it (thin, low, along the ground)",
    THIN: "I catch it thin",
    FAT: "I hit it fat (ground first)",
    LOW_WEAK: "Low, weak flight",
};

export function missLabel(miss: string): string {
    return MISS_LABELS[miss as MissKey] ?? miss;
}
