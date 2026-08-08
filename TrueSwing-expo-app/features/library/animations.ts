import { Easing } from "react-native-reanimated";

// Shared motion tokens for the library, so every level of the hierarchy arrives
// the same way. Mirrors features/home/animations.ts.

export const LIBRARY_ANIM = {
    /** Entrance duration for one row (ms). */
    rowDuration: 420,
    /** Delay before the first row moves (ms). */
    rowDelay: 30,
    /** Delay added per row (ms). */
    rowStep: 45,
    /** Rows past this index all share the same delay. Without the clamp a long
     *  candidate list takes seconds to finish arriving, and everything below the
     *  fold is paying for animation nobody watches. */
    rowStaggerCap: 8,
    /** px each row travels up on entry. */
    rowRise: 9,
} as const;

/** Decelerating, no overshoot. */
export const ROW_EASING = Easing.bezier(0.22, 0.61, 0.36, 1);

export function rowDelay(index: number): number {
    return LIBRARY_ANIM.rowDelay + Math.min(index, LIBRARY_ANIM.rowStaggerCap) * LIBRARY_ANIM.rowStep;
}
