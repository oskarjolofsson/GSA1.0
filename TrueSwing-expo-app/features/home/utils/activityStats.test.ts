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

    it("stamps each cell with its local YYYY-MM-DD date", () => {
        const { week } = deriveActivityStats([], NOW);
        expect(week[6].date).toBe(day(0)); // today
        expect(week[0].date).toBe(day(-6)); // six days ago
        expect(week[6].date).toBe("2026-06-19");
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

    it("sums a day that comes back split across areas", () => {
        // /activity/ returns one row per (day, area), so a day of putting plus a day of
        // range arrives as two rows. This screen does not care which area — it asks
        // whether the day happened — so the rows have to add up, not overwrite.
        const counts: ActivityCount[] = [
            { occurred_on: day(0), area: "PUTTING", count: 1 },
            { occurred_on: day(0), area: "FULL_SWING", count: 1 },
            { occurred_on: day(-1), area: null, count: 1 },
        ];
        const { week } = deriveActivityStats(counts, NOW);
        expect(week[6]).toMatchObject({ done: true, level: 2 });
        expect(week[5]).toMatchObject({ done: true, level: 1 });
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

describe("deriveActivityStats — month grid", () => {
    // The layout is the part that is easy to get subtly wrong, and wrong here means
    // a golfer reads someone else's fortnight as their own. Two rows of fourteen,
    // newest fortnight FIRST, chronological within each row.
    //
    //   index  0..13   day -13 .. day 0    (today is the LAST cell of row one)
    //   index 14..27   day -27 .. day -14

    it("returns 28 cells", () => {
        expect(deriveActivityStats([], NOW).month).toHaveLength(28);
    });

    it("puts today at the end of the first row, not the end of the grid", () => {
        const { month } = deriveActivityStats([], NOW);

        expect(month[13].date).toBe(day(0));
        expect(month[13].isToday).toBe(true);
        // The last cell overall is a fortnight ago, because the newest row is on top.
        expect(month[27].date).toBe(day(-14));
        expect(month.filter((c) => c.isToday)).toHaveLength(1);
    });

    it("runs oldest to newest within each row", () => {
        const { month } = deriveActivityStats([], NOW);

        expect(month[0].date).toBe(day(-13));
        expect(month[13].date).toBe(day(0));
        expect(month[14].date).toBe(day(-27));
        expect(month[27].date).toBe(day(-14));
    });

    it("covers every one of the last 28 days exactly once", () => {
        const { month } = deriveActivityStats([], NOW);
        const expected = new Set(Array.from({ length: 28 }, (_, i) => day(-i)));

        expect(new Set(month.map((c) => c.date))).toEqual(expected);
    });

    it("lights the right cells and leaves the rest empty", () => {
        const counts: ActivityCount[] = [
            { occurred_on: day(-2), count: 1 },
            { occurred_on: day(-20), count: 3 },
        ];
        const { month } = deriveActivityStats(counts, NOW);

        expect(month.find((c) => c.date === day(-2))?.level).toBe(1);
        expect(month.find((c) => c.date === day(-20))?.level).toBe(2);
        expect(month.filter((c) => c.done)).toHaveLength(2);
    });

    it("ignores activity older than the window", () => {
        const counts: ActivityCount[] = [{ occurred_on: day(-40), count: 5 }];
        const { month } = deriveActivityStats(counts, NOW);

        expect(month.every((c) => !c.done)).toBe(true);
        // ...but it still counts as having ever practised, which drives the
        // first-run copy rather than the grid.
        expect(deriveActivityStats(counts, NOW).hasActivity).toBe(true);
    });

    it("still spans 28 days across a month boundary", () => {
        // 2026-03-05: the window reaches back into February, and 2026 is not a leap
        // year, so a naive day-of-month walk would land wrong.
        const march = new Date(2026, 2, 5, 12, 0, 0);
        const { month } = deriveActivityStats([], march);

        expect(month[13].date).toBe("2026-03-05");
        expect(month[14].date).toBe("2026-02-06");
        expect(new Set(month.map((c) => c.date)).size).toBe(28);
    });
});
