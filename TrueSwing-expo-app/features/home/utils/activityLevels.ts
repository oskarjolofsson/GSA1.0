// Single source of truth for contribution-grid cell colors. One meaning per
// color, reused anywhere the activity grid renders so the mapping never drifts.
//   0 = no session (dark navy)
//   1 = session logged (light green)
//   2 = stronger session (brighter green)
export type ActivityLevel = 0 | 1 | 2;

export const ACTIVITY_COLORS: Record<ActivityLevel, string> = {
    0: "#1A2435",
    1: "#5E9B7E",
    2: "#7FBE9B",
};

// Today's cell: same footprint as the rest, dashed sand outline, no fill.
export const TODAY_BORDER = "#C9B68C";
