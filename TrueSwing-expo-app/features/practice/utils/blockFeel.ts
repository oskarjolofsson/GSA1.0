/**
 * How a focused practice block went: one tap for the whole block.
 *
 * Stored as a small ordinal in the drill run's `feel` column, 0 meaning no rating. The
 * ordinal and the wire values (`rough | ok | dialed`) are the contract; `GRADE_LABEL` is
 * display only, so rewording never touches stored data.
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
 * The one place a grade becomes words. Keyed on the WIRE value rather than on `BlockFeel`,
 * because one of the three consumers reads the server's string straight off a drill run.
 */
export const GRADE_LABEL: Record<string, string> = {
  rough: 'Poor',
  ok: 'OK',
  dialed: 'Very good',
};

/**
 * Label for a grade of unknown provenance, e.g. `PracticeDrillRun.grade` off the wire.
 * Falls back to the raw string rather than to empty, so an unrecognised grade still shows
 * the golfer something.
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
