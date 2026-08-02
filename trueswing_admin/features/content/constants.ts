/**
 * Display labels for the tag vocabularies, read from the taxonomy the API serves.
 *
 * These used to be four hardcoded maps here, mirrored again in the expo app — four
 * hand-synced copies of one list. Adding a miss meant a migration plus three file edits,
 * which is a large part of why four areas of the game went unauthored. The labels live in
 * `taxonomy_areas` / `taxonomy_goals` / `taxonomy_misses` now, and both apps read them.
 *
 * `labelsFrom(taxonomy)` returns the same helpers the components already called, so the
 * call sites did not change shape — only where the words come from. Pass `null` (the
 * taxonomy fetch failed) and every helper falls back to the raw key, so a picker degrades
 * to "LOW_WEAK" rather than rendering blank.
 */

import type { Taxonomy, TaxonomyTerm } from "@/lib/content/types";

/**
 * `kind` is the one vocabulary still defined in code. It is a two-value structural flag
 * (a fault is diagnosable and gets a retest, a skill is not) that changes how the program
 * engine behaves — not content anyone authors, so a lookup table would be ceremony.
 */
const KIND_LABELS: Record<string, string> = {
  fault: "Fault",
  skill: "Skill",
};

const byKey = (terms: readonly TaxonomyTerm[] | undefined, key: string) =>
  terms?.find((t) => t.key === key);

export type Labels = ReturnType<typeof labelsFrom>;

export function labelsFrom(taxonomy: Taxonomy | null | undefined) {
  return {
    /** Admin-facing wording: "Slice", "Full swing". Terser than what a golfer reads. */
    areaLabel: (v: string) => byKey(taxonomy?.areas, v)?.label ?? v,
    goalLabel: (v: string) => byKey(taxonomy?.goals, v)?.label ?? v,
    missLabel: (v: string) => byKey(taxonomy?.misses, v)?.label ?? v,
    kindLabel: (v: string) => KIND_LABELS[v] ?? v,

    /**
     * Golfer-facing phrasing, for the preview pane: what a player actually reads rather
     * than the admin's shorthand.
     *
     * Title and subtitle are joined here because the preview is one line. The expo app
     * renders them as two — `golfer_label` bold, `blurb` underneath — which is why they
     * are separate columns rather than one string. That split is also why the old
     * hardcoded "I slice it (curves hard right)" no longer appears anywhere.
     */
    golferMissLabel: (v: string) => {
      const term = byKey(taxonomy?.misses, v);
      if (!term) return v;
      return term.blurb
        ? `${term.golfer_label} (${term.blurb.toLowerCase()})`
        : term.golfer_label;
    },
    golferGoalLabel: (v: string) => byKey(taxonomy?.goals, v)?.golfer_label ?? v,
  };
}

/**
 * The misses valid for one area, as the picker should offer them.
 *
 * A miss belongs to exactly one area — a putt is not sliced — and the backend refuses a
 * cross-area tag, so offering the full list would let an admin tick something the save
 * then rejects.
 */
export function missesForArea(
  taxonomy: Taxonomy | null | undefined,
  area: string,
): string[] {
  return (taxonomy?.misses_by_area?.[area] ?? []).map((m) => m.key);
}
