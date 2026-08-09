/**
 * How a focused practice block went.
 *
 * The honest, low-friction signal that replaces per-shot GOOD/BAD self-grading: one tap
 * for the whole block.
 *
 * Stored as a small ordinal in the drill run's own `feel` column, 0 meaning no rating
 * (`PracticeDrillRun.feel` in `lib/api/schema.d.ts`). An earlier build kept it in
 * `successful_reps` to dodge a migration and the comment here still described that
 * arrangement long after it stopped being true -- worth naming, because a comment that
 * says the opposite of the code is worse than no comment.
 *
 * THE ORDINAL AND THE WIRE VALUES ARE THE CONTRACT; THE LABELS ARE NOT. `rough | ok |
 * dialed` are what the server stores, what `DrillGradeValue` sends, and what
 * `PracticeDrillRun.grade` returns. `GRADE_LABEL` is display only, so rewording never
 * touches stored data and never needs a migration.
 */

export type BlockFeel = 'rough' | 'ok' | 'dialed';

const FEEL_ORDINAL: Record<BlockFeel, number> = {
  rough: 1,
  ok: 2,
  dialed: 3,
};

const ORDINAL_FEEL: Record<number, BlockFeel> = {
  1: 'rough',
  2: 'ok',
  3: 'dialed',
};

/**
 * The one place a grade becomes words.
 *
 * Keyed on the WIRE value rather than on `BlockFeel`, because three separate screens need
 * this and one of them reads the server's string: the feel picker, the live caption under
 * the rating input, and the session score list. Three independent copies of the mapping
 * would drift the first time the wording is retuned -- and the score list has already been
 * missed once, rendering a raw `DIALED` while the picker said something friendlier.
 *
 * "Rough / OK / Dialed" became "Poor / OK / Very good" so the scale reads as one register
 * instead of two vibe words and a piece of golf slang a second-language golfer has to
 * decode.
 */
export const GRADE_LABEL: Record<string, string> = {
  rough: 'Poor',
  ok: 'OK',
  dialed: 'Very good',
};

/**
 * Label for a grade of unknown provenance, e.g. `PracticeDrillRun.grade` off the wire.
 *
 * Falls back to the raw string rather than to empty. A grade this build has never heard of
 * is the same situation as a metric type authored after release: showing the golfer
 * something imperfect beats showing them a blank where their score should be.
 */
export function gradeLabel(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return GRADE_LABEL[raw] ?? raw;
}

export function feelToOrdinal(feel: BlockFeel | null): number {
  return feel ? FEEL_ORDINAL[feel] : 0;
}

export function ordinalToFeel(ordinal: number): BlockFeel | null {
  return ORDINAL_FEEL[ordinal] ?? null;
}
