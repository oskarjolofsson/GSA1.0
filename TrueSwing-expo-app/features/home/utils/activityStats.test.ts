import {
    deriveActivityStats,
    localDateString,
    countToLevel,
    type ActivityCount,
} from "features/home/utils/activityStats";

// Fixed "now" so the rolling window is deterministic: Fri 2026-06-19, midday.
const NOW = new Date(2026, 5, 19, 12, 0, 0); // month is 0-indexed (5 = June)

function day(offset: number): string {
    const d = new Date(NOW);
    d.setDate(d.getDate() + offset);
    return localDateString(d);
}

describe("countToLevel", () => {
    it("maps counts to levels", () => {
        expect(countToLevel(0)).toBe(0);
        expect(countToLevel(1)).toBe(1);
        expect(countToLevel(2)).toBe(2);
        expect(countToLevel(9)).toBe(2);
    });
});

describe("deriveActivityStats — rolling window", () => {
    it("returns 7 cells with today rightmost and weekday letters from real dates", () => {
        const { week } = deriveActivityStats([], NOW);
        expect(week).toHaveLength(7);
        expect(week[6].isToday).toBe(true);
        expect(week.slice(0, 6).every((c) => !c.isToday)).toBe(true);
        // 2026-06-19 is a Friday -> "F"; the day before is Thursday -> "T".
        expect(week[6].letter).toBe("F");
        expect(week[5].letter).toBe("T");
    });

    it("fills done/level from counts", () => {
        const counts: ActivityCount[] = [
            { occurred_on: day(0), count: 2 }, // today, stronger
            { occurred_on: day(-2), count: 1 }, // logged
        ];
        const { week } = deriveActivityStats(counts, NOW);
        expect(week[6]).toMatchObject({ isToday: true, done: true, level: 2 });
        expect(week[4]).toMatchObject({ done: true, level: 1 });
        expect(week[5]).toMatchObject({ done: false, level: 0 });
    });
});

describe("deriveActivityStats — streak", () => {
    it("counts today when today is done", () => {
        const counts: ActivityCount[] = [
            { occurred_on: day(0), count: 1 },
            { occurred_on: day(-1), count: 1 },
            { occurred_on: day(-2), count: 3 },
        ];
        expect(deriveActivityStats(counts, NOW).streakDays).toBe(3);
    });

    it("counts from yesterday when today is not done yet", () => {
        const counts: ActivityCount[] = [
            { occurred_on: day(-1), count: 1 },
            { occurred_on: day(-2), count: 1 },
        ];
        expect(deriveActivityStats(counts, NOW).streakDays).toBe(2);
    });

    it("stops at the first gap", () => {
        const counts: ActivityCount[] = [
            { occurred_on: day(0), count: 1 },
            // gap at day(-1)
            { occurred_on: day(-2), count: 1 },
        ];
        expect(deriveActivityStats(counts, NOW).streakDays).toBe(1);
    });

    it("is 0 when neither today nor yesterday is done", () => {
        const counts: ActivityCount[] = [{ occurred_on: day(-3), count: 1 }];
        expect(deriveActivityStats(counts, NOW).streakDays).toBe(0);
    });
});

describe("deriveActivityStats — hasActivity", () => {
    it("is false for empty counts and true otherwise", () => {
        expect(deriveActivityStats([], NOW).hasActivity).toBe(false);
        expect(deriveActivityStats([{ occurred_on: day(-10), count: 1 }], NOW).hasActivity).toBe(true);
    });
});
