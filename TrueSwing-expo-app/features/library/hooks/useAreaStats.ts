import { useMemo } from "react";

import useActivity from "features/home/hooks/useActivity";
import usePrograms from "features/programs/hooks/usePrograms";

import { buildAreaActivity, formatRelativeDay } from "../utils/areaActivity";

export type AreaStats = {
    /** Open programs in this area. The backend caps this at two (ProgramSummary.slot). */
    programs: number;
    /** Session counts per day, oldest first, today last. */
    days: number[];
    /** "yesterday", "3w ago", or null when this area has never been practised. */
    lastLabel: string | null;
};

/**
 * What the golfer has done in each area, for the library landing rows.
 *
 * Deliberately additive: the landing renders from the taxonomy alone, and neither
 * of these requests may hold it up or take it down. Both hooks swallow their own
 * errors, and an area simply has no stats until its data arrives -- which reads
 * identically to an area the golfer has never touched, and is the one case where
 * that ambiguity is harmless.
 */
export default function useAreaStats(): Record<string, AreaStats> {
    const { counts } = useActivity();
    // `programs` rather than `byArea`: the latter is rebuilt inline on every
    // render of usePrograms, so memoizing on it would recompute every time.
    const { programs } = usePrograms();

    return useMemo(() => {
        const activity = buildAreaActivity(counts);

        const openByArea: Record<string, number> = {};
        for (const program of programs) {
            if (!program.area || program.status !== "active") continue;
            openByArea[program.area] = (openByArea[program.area] ?? 0) + 1;
        }

        const stats: Record<string, AreaStats> = {};
        for (const key of new Set([...Object.keys(activity), ...Object.keys(openByArea)])) {
            stats[key] = {
                programs: openByArea[key] ?? 0,
                days: activity[key]?.days ?? [],
                lastLabel: activity[key]?.lastPractisedOn
                    ? formatRelativeDay(activity[key].lastPractisedOn as string)
                    : null,
            };
        }
        return stats;
    }, [counts, programs]);
}
