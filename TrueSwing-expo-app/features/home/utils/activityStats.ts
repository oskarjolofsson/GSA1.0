import type { ActivityLevel } from "features/home/utils/activityLevels";

// One activity-count row from GET /activity.
export type ActivityCount = { occurred_on: string; count: number };

// One rendered grid cell in the rolling 7-day strip.
export type DayCell = {
    letter: string; // weekday initial, derived from the real date
    level: ActivityLevel; // 0 none / 1 logged / 2 stronger
    isToday: boolean;
    done: boolean; // count >= 1 that day
};

export type ActivityStats = {
    week: DayCell[]; // 7 cells, oldest -> today (today rightmost)
    streakDays: number;
    hasActivity: boolean; // any activity ever (drives the welcome empty state)
};

const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"]; // index = Date.getDay()

// Local YYYY-MM-DD for a Date — uses the device timezone. We deliberately avoid
// toISOString(), which converts to UTC and can shift the day across midnight.
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

// Pure derivation of the streak number + rolling-7 grid from the raw counts.
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
            letter: WEEKDAY_INITIALS[date.getDay()],
            level: countToLevel(count),
            isToday: offset === 0,
            done: count >= 1,
        });
    }

    // Streak: walk back from today while each day has activity. If today isn't
    // done yet, start from yesterday so the streak doesn't read 0 every morning.
    let streakDays = 0;
    let cursor = new Date(now);
    if ((byDay.get(localDateString(cursor)) ?? 0) < 1) {
        cursor = addDays(cursor, -1);
    }
    while ((byDay.get(localDateString(cursor)) ?? 0) >= 1) {
        streakDays += 1;
        cursor = addDays(cursor, -1);
    }

    return { week, streakDays, hasActivity: counts.length > 0 };
}

function addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}
