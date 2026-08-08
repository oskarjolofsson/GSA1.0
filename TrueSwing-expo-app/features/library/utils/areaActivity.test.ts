import {
    ACTIVITY_WINDOW_DAYS,
    buildAreaActivity,
    formatRelativeDay,
} from "./areaActivity";
import type { ActivityCount } from "features/home/utils/activityStats";

const TODAY = new Date(2026, 7, 7, 9); // 2026-08-07, local
const count = (occurred_on: string, area: string | null, n: number): ActivityCount =>
    ({ occurred_on, area, count: n }) as ActivityCount;

describe("buildAreaActivity", () => {
    it("puts today at the last index and yesterday one before it", () => {
        const byArea = buildAreaActivity(
            [count("2026-08-07", "PUTTING", 2), count("2026-08-06", "PUTTING", 1)],
            TODAY
        );
        const days = byArea.PUTTING.days;
        expect(days).toHaveLength(ACTIVITY_WINDOW_DAYS);
        expect(days[ACTIVITY_WINDOW_DAYS - 1]).toBe(2);
        expect(days[ACTIVITY_WINDOW_DAYS - 2]).toBe(1);
    });

    it("includes the oldest day in the window and excludes the day before it", () => {
        const byArea = buildAreaActivity(
            [count("2026-07-22", "CHIPPING", 1), count("2026-07-21", "CHIPPING", 5)],
            TODAY
        );
        // 2026-07-22 is 16 days back -- the first cell. 07-21 falls outside.
        expect(byArea.CHIPPING.days[0]).toBe(1);
        expect(byArea.CHIPPING.days.reduce((a, b) => a + b, 0)).toBe(1);
    });

    it("reports last practised from outside the window, so a lapsed area stays honest", () => {
        const byArea = buildAreaActivity([count("2026-06-01", "BUNKER", 3)], TODAY);
        expect(byArea.BUNKER.days.every((d) => d === 0)).toBe(true);
        expect(byArea.BUNKER.lastPractisedOn).toBe("2026-06-01");
    });

    it("sums multiple rows landing on the same day", () => {
        const byArea = buildAreaActivity(
            [count("2026-08-07", "FULL_SWING", 1), count("2026-08-07", "FULL_SWING", 2)],
            TODAY
        );
        expect(byArea.FULL_SWING.days[ACTIVITY_WINDOW_DAYS - 1]).toBe(3);
    });

    it("keeps the newest date when rows arrive out of order", () => {
        const byArea = buildAreaActivity(
            [count("2026-08-05", "PITCHING", 1), count("2026-07-01", "PITCHING", 1)],
            TODAY
        );
        expect(byArea.PITCHING.lastPractisedOn).toBe("2026-08-05");
    });

    it("drops unattributed rows rather than crediting an area with them", () => {
        const byArea = buildAreaActivity([count("2026-08-07", null, 4)], TODAY);
        expect(Object.keys(byArea)).toHaveLength(0);
    });

    it("ignores zero-count rows so they cannot set last practised", () => {
        const byArea = buildAreaActivity([count("2026-08-07", "PUTTING", 0)], TODAY);
        expect(byArea.PUTTING).toBeUndefined();
    });

    it("returns nothing for an account with no activity", () => {
        expect(buildAreaActivity([], TODAY)).toEqual({});
    });
});

describe("formatRelativeDay", () => {
    it.each([
        ["2026-08-07", "today"],
        ["2026-08-06", "yesterday"],
        ["2026-08-03", "4d ago"],
        ["2026-08-01", "6d ago"],
        ["2026-07-31", "1w ago"],
        ["2026-07-17", "3w ago"],
        ["2026-06-01", "2mo ago"],
    ])("formats %s as %s", (iso, expected) => {
        expect(formatRelativeDay(iso, TODAY)).toBe(expected);
    });

    it("never reports a future date as negative days", () => {
        expect(formatRelativeDay("2026-08-09", TODAY)).toBe("today");
    });
});
