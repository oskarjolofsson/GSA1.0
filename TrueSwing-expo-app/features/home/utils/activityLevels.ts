// Single source of truth for contribution-grid cell colors. One meaning per
// color, reused anywhere the activity grid renders so the mapping never drifts.
//   0 = no session       (ink-raised square)
//   1 = session logged   (sand)
//   2 = stronger session (gold)
//
// THE SCALE KEEPS GOLD, WHICH IS AN EXCEPTION TO DESIGN.md's THREE-PER-SCREEN CAP.
// The 2026-08-09 home simplification briefly dimmed level 2 to sand-at-85%, on the
// theory that a 28-day grid would put ~10 gold squares on screen and outshine the
// one gold thing that matters ("Start practice"). Checked on a device, that was
// wrong twice over: a golfer typically has a handful of lit days, not ten, and the
// streak section is now small and low enough on the screen that the squares read as
// texture rather than competition.
//
// The cap is about ACCENT — chrome and calls to action fighting for the eye. A
// contribution scale is data: the colour encodes a value, and the two steps have to
// be told apart at ~21px. Sand and gold do that; two opacities of sand did not.
// Written down here because the next person to widen this grid will have the same
// thought, and the answer is "it was tried, on hardware, and reverted".
//
// (The old comments here said "light green" / "brighter green" against these sand
// and gold values — leftovers from the pre-brand palette DESIGN.md warns about.)
export type ActivityLevel = 0 | 1 | 2;

export const ACTIVITY_COLORS: Record<ActivityLevel, string> = {
    0: "#1A2435",
    1: "#EADFC8",
    2: "#E4C892",
};

// Today's cell: same footprint as the rest, dashed sand outline, no fill.
export const TODAY_BORDER = "#C9B68C";
