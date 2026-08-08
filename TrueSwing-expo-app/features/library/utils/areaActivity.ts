import { localDateString } from "features/home/utils/activityStats";
import type { ActivityCount } from "features/home/utils/activityStats";

/** Days of history the library strip shows. Chosen deliberately: not a week
 *  multiple, wide enough that a twice-a-week golfer sees a pattern rather than
 *  two isolated marks. */
export const ACTIVITY_WINDOW_DAYS = 17;

export type AreaActivity = {
    /** Session count per day, oldest first, length ACTIVITY_WINDOW_DAYS, today last. */
    days: number[];
    /** Local YYYY-MM-DD of the most recent day with activity, or null for never.
     *  Deliberately NOT clamped to the window -- an area last practised two months
     *  ago has an empty strip but still owes the golfer an honest "2mo ago". */
    lastPractisedOn: string | null;
};

function emptyDays(): number[] {
    return new Array(ACTIVITY_WINDOW_DAYS).fill(0);
}

/** Noon rather than midnight so a DST shift can't round the difference to the
 *  wrong day. */
function parseLocalDate(iso: string): Date {
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(year, month - 1, day, 12);
}

/**
 * Per-area day counts and last-practised date, keyed by taxonomy area key.
 *
 * Rows with no area are dropped: they are pre-taxonomy sessions that belong to no
 * row on this screen, and filing them under a default would silently credit one
 * area with another's work.
 */
export function buildAreaActivity(
    counts: ActivityCount[],
    today: Date = new Date()
): Record<string, AreaActivity> {
    const indexByDate = new Map<string, number>();
    const cursor = parseLocalDate(localDateString(today));
    for (let offset = ACTIVITY_WINDOW_DAYS - 1; offset >= 0; offset--) {
        const day = new Date(cursor);
        day.setDate(day.getDate() - offset);
        indexByDate.set(localDateString(day), ACTIVITY_WINDOW_DAYS - 1 - offset);
    }

    const byArea: Record<string, AreaActivity> = {};
    for (const row of counts) {
        if (!row.area || row.count <= 0) continue;

        const entry = (byArea[row.area] ??= { days: emptyDays(), lastPractisedOn: null });

        const index = indexByDate.get(row.occurred_on);
        if (index !== undefined) entry.days[index] += row.count;

        // ISO dates compare correctly as strings, so no parse is needed here.
        if (!entry.lastPractisedOn || row.occurred_on > entry.lastPractisedOn) {
            entry.lastPractisedOn = row.occurred_on;
        }
    }
    return byArea;
}

/**
 * "yesterday", "4d ago", "3w ago" -- the row has ~90pt for this, so it stays
 * short and never spells out a date.
 */
export function formatRelativeDay(iso: string, today: Date = new Date()): string {
    const then = parseLocalDate(iso);
    const now = parseLocalDate(localDateString(today));
    const days = Math.round((now.getTime() - then.getTime()) / 86_400_000);

    if (days <= 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 56) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
}
