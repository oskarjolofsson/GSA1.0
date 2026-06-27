// How a focused practice block felt. The honest, low-friction signal that replaces
// per-shot GOOD/BAD self-grading. Phase 1 stores this in the existing
// `successful_reps` column as a small ordinal (0 = no rating) to avoid a migration;
// Phase 2 will move it to a dedicated `feel` column.

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

export const FEEL_LABEL: Record<BlockFeel, string> = {
    rough: 'Rough',
    ok: 'OK',
    dialed: 'Dialed',
};

export function feelToOrdinal(feel: BlockFeel | null): number {
    return feel ? FEEL_ORDINAL[feel] : 0;
}

export function ordinalToFeel(ordinal: number): BlockFeel | null {
    return ORDINAL_FEEL[ordinal] ?? null;
}
