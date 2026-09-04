import type { ActivityLevel } from "features/home/utils/activityLevels";
import type { Schemas } from "lib/api/types";

// One activity-count row from GET /activity.
export type ActivityCount = Schemas["ActivityCount"];

// One rendered grid cell in the rolling 7-day strip.
export type DayCell = {
    date: string; // local YYYY-MM-DD for this cell (used to fetch day detail)
    letter: string; // weekday initial, derived from the real date
    level: ActivityLevel; // 0 none / 1 logged / 2 stronger
    isToday: boolean;
    done: boolean; // count >= 1 that day
};

export type ActivityStats = {
    week: DayCell[]; // 7 cells, oldest -> today (today rightmost)
    /**
     * 28 cells for the home grid: two rows of fourteen, newest fortnight first, read
     * row-major.
     *
     *   index  0..13   days -13 .. today   (today is index 13, the last cell)
     *   index 14..27   days -27 .. -14
     *
     * A rolling 28-day window ending today, NOT a calendar -- at fourteen columns nothing
     * lines up by weekday, which is why the letters are unused in this grid.
     */
    month: DayCell[];
    streakDays: number;
    hasActivity: boolean; // any activity ever (drives the welcome empty state)
};

/** Two rows of fourteen. Changing this changes the grid's column count too. */
export const MONTH_DAYS = 28;
const FORTNIGHT = 14;

const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"]; // index = Date.getDay()

// Local YYYY-MM-DD in the device timezone. Deliberately not toISOString(), which converts
// to UTC and can shift the day across midnight.
export function localDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

export function countToLevel(count: number): ActivityLevel {
    if (count <= 0) return 0;
    if (count === 1) return 1;
    return 2;
}

// `now` is injectable so tests are deterministic.
export function deriveActivityStats(counts: ActivityCount[], now: Date = new Date()): ActivityStats {
    const byDay = new Map<string, number>();
    for (const { occurred_on, count } of counts) {
        byDay.set(occurred_on, (byDay.get(occurred_on) ?? 0) + count);
    }

    // Rolling window: 6 days ago .. today (today rightmost).
    const week: DayCell[] = [];
    for (let offset = 6; offset >= 0; offset--) {
        const date = addDays(now, -offset);
        const key = localDateString(date);
        const count = byDay.get(key) ?? 0;
        week.push({
            date: key,
            letter: WEEKDAY_INITIALS[date.getDay()],
            level: countToLevel(count),
            isToday: offset === 0,
            done: count >= 1,
        });
    }

    // Walk back from today while each day has activity. If today is not done yet, start
    // from yesterday, or the streak reads 0 every morning.
    let streakDays = 0;
    let cursor = new Date(now);
    if ((byDay.get(localDateString(cursor)) ?? 0) < 1) {
        cursor = addDays(cursor, -1);
    }
    while ((byDay.get(localDateString(cursor)) ?? 0) >= 1) {
        streakDays += 1;
        cursor = addDays(cursor, -1);
    }

    // Built fortnight by fortnight so the newest lands in the first row; within a
    // fortnight days still run oldest -> newest, so the first row's last cell is today.
    const month: DayCell[] = [];
    for (let row = 0; row < MONTH_DAYS / FORTNIGHT; row++) {
        const newestOffset = row * FORTNIGHT; // 0 for the top row, 14 for the next
        for (let i = FORTNIGHT - 1; i >= 0; i--) {
            month.push(cellFor(addDays(now, -(newestOffset + i)), byDay, now));
        }
    }

    return { week, month, streakDays, hasActivity: counts.length > 0 };
}

function cellFor(date: Date, byDay: Map<string, number>, now: Date): DayCell {
    const key = localDateString(date);
    const count = byDay.get(key) ?? 0;
    return {
        date: key,
        letter: WEEKDAY_INITIALS[date.getDay()],
        level: countToLevel(count),
        isToday: key === localDateString(now),
        done: count >= 1,
    };
}

function addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}
