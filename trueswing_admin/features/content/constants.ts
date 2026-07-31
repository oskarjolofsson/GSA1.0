/**
 * Display labels for the tag vocabularies.
 *
 * Membership comes from GET /api/v1/taxonomy/ — never hardcode which values exist,
 * because the write paths validate strictly and a drifted list means a save that
 * fails on a tag the admin was offered. These are only the words shown next to a
 * checkbox, and they are deliberately terser than the golfer-facing copy in
 * TrueSwing-expo-app/features/library/constants (which asks "Which sounds like
 * you?" and phrases a miss as "I slice it (curves hard right)").
 *
 * Anything not listed falls back to the raw value, so a new taxonomy entry shows up
 * as e.g. "LOW_SPIN" rather than disappearing.
 */
const MISS_LABELS: Record<string, string> = {
  SLICE: "Slice",
  HOOK: "Hook",
  PULL: "Pull",
  PUSH: "Push",
  TOP: "Top",
  THIN: "Thin",
  FAT: "Fat",
  LOW_WEAK: "Low / weak",
};

const GOAL_LABELS: Record<string, string> = {
  STRAIGHTER: "Straighter",
  DISTANCE: "Distance",
  CONTACT: "Contact",
  BIG_MISS: "Kill the big miss",
  SHORT_GAME: "Short game",
  PUTTING: "Putting",
};

const AREA_LABELS: Record<string, string> = {
  FULL_SWING: "Full swing",
  CHIPPING: "Chipping",
  PUTTING: "Putting",
  BUNKER: "Bunker",
  PITCHING: "Pitching",
};

const KIND_LABELS: Record<string, string> = {
  fault: "Fault",
  skill: "Skill",
};

/**
 * Golfer-facing phrasing, mirrored from the expo app so the preview pane shows what
 * a player actually reads rather than the admin's shorthand.
 *
 * Mirrored, not shared: the two apps have no common package. Keep in sync with
 * TrueSwing-expo-app/features/library/constants/Misses.ts — a follow-up issue moves
 * this copy into the database so both read it from the backend instead.
 */
const GOLFER_MISS_LABELS: Record<string, string> = {
  SLICE: "I slice it (curves hard right)",
  HOOK: "I hook it (curves hard left)",
  PULL: "I pull it (starts left, stays left)",
  PUSH: "I push it (starts right, stays right)",
  TOP: "I top it (thin, low, along the ground)",
  THIN: "I catch it thin",
  FAT: "I hit it fat (ground first)",
  LOW_WEAK: "Low, weak flight",
};

const GOLFER_GOAL_LABELS: Record<string, string> = {
  STRAIGHTER: "Hit it straighter",
  DISTANCE: "More distance",
  CONTACT: "Better contact",
  BIG_MISS: "Kill the big miss",
  SHORT_GAME: "Sharper short game",
  PUTTING: "Better putting",
};

export const missLabel = (v: string) => MISS_LABELS[v] ?? v;
export const goalLabel = (v: string) => GOAL_LABELS[v] ?? v;
export const areaLabel = (v: string) => AREA_LABELS[v] ?? v;
export const kindLabel = (v: string) => KIND_LABELS[v] ?? v;
export const golferMissLabel = (v: string) => GOLFER_MISS_LABELS[v] ?? v;
export const golferGoalLabel = (v: string) => GOLFER_GOAL_LABELS[v] ?? v;
