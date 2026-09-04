/**
 * Display labels for the tag vocabularies, read from the taxonomy the API serves.
 * See ADR-0008.
 *
 * Pass `null` — the taxonomy fetch failed — and every helper falls back to the raw key,
 * so a picker degrades to "LOW_WEAK" rather than rendering blank.
 */

import type { Taxonomy, TaxonomyTerm } from "@/lib/content/types";

/**
 * `kind` is the one vocabulary still defined in code: a two-value structural flag
 * deciding which branch of the library an issue appears under (a fault is listed under
 * its misses, a skill under its goals), not content anyone authors.
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
     * Golfer-facing phrasing for the preview pane. Joins `golfer_label` and `blurb`
     * because the preview is one line; the expo app renders them as two.
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
 * cross-area tag, so offering the full list would let an admin tick a value the save
 * then rejects.
 */
export function missesForArea(
  taxonomy: Taxonomy | null | undefined,
  area: string,
): string[] {
  return (taxonomy?.misses_by_area?.[area] ?? []).map((m) => m.key);
}
