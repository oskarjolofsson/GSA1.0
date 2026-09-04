// Single source of truth for contribution-grid cell colors. One meaning per color, reused
// anywhere the activity grid renders so the mapping never drifts.
//   0 = no session       (ink-raised square)
//   1 = session logged   (sand)
//   2 = stronger session (gold)
//
// The scale keeps gold, which is an exception to DESIGN.md's three-per-screen cap. See
// ADR-0021 -- dimming level 2 was tried on hardware and reverted.
export type ActivityLevel = 0 | 1 | 2;

export const ACTIVITY_COLORS: Record<ActivityLevel, string> = {
    0: "#1A2435",
    1: "#EADFC8",
    2: "#E4C892",
};

// Today's cell: same footprint as the rest, dashed sand outline, no fill.
export const TODAY_BORDER = "#C9B68C";
