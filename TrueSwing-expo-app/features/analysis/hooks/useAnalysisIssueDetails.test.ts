import { renderHook, waitFor } from "@testing-library/react-native";

import issueService from "features/issues/services/issueService";
import drillService from "features/drill/services/drillService";
import useAnalysisIssueDetails from "features/analysis/hooks/useAnalysisIssueDetails";
import type { Issue } from "features/issues/types";
import type { Drill } from "features/drill/types";

jest.mock("features/issues/services/issueService", () => ({
    __esModule: true,
    default: { getIssuesByAnalysis: jest.fn() },
}));

jest.mock("features/drill/services/drillService", () => ({
    __esModule: true,
    default: { getDrillsByIssue: jest.fn() },
}));

jest.mock("features/library/services/taxonomyService", () => ({
    __esModule: true,
    fetchTaxonomy: jest.fn().mockResolvedValue({
        areas: [],
        goals: [],
        misses_by_area: {
            FULL_SWING: [{ key: "slice", golfer_label: "Slicing it" }],
        },
    }),
    readCachedTaxonomy: jest.fn().mockResolvedValue(null),
}));

const mockGetIssues = issueService.getIssuesByAnalysis as jest.Mock;
const mockGetDrills = drillService.getDrillsByIssue as jest.Mock;

const issue = (over: Partial<Issue> = {}): Issue =>
    ({
        id: "issue-1",
        title: "Early extension",
        description: "You're standing up through impact.",
        current_motion: null,
        expected_motion: null,
        swing_effect: null,
        shot_outcome: null,
        created_at: "2026-01-01T00:00:00Z",
        area: "FULL_SWING",
        kind: "fault",
        source: "catalog",
        goals: [],
        misses: [],
        ...over,
    }) as Issue;

const drill = (over: Partial<Drill> = {}): Drill =>
    ({
        id: "drill-1",
        title: "Wall drill",
        task: "Do the thing",
        success_signal: "Feels right",
        fault_indicator: "Doesn't",
        created_at: "2026-01-01T00:00:00Z",
        ...over,
    }) as Drill;

describe("useAnalysisIssueDetails", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("does nothing without an analysisId", async () => {
        const { result } = await renderHook(() => useAnalysisIssueDetails(null));
        expect(result.current.detailsByIssueId).toEqual({});
        expect(result.current.loading).toBe(false);
        expect(mockGetIssues).not.toHaveBeenCalled();
    });

    it("starts loading, then joins issue title/description/misses with its drills by issue_id", async () => {
        mockGetIssues.mockResolvedValue([issue({ misses: ["slice"] })]);
        mockGetDrills.mockResolvedValue([drill()]);

        const { result } = await renderHook(() => useAnalysisIssueDetails("analysis-1"));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(mockGetDrills).toHaveBeenCalledWith("issue-1");
        expect(result.current.detailsByIssueId["issue-1"]).toEqual({
            title: "Early extension",
            description: "You're standing up through impact.",
            area: "FULL_SWING",
            missLabels: ["Slicing it"],
            drills: [drill()],
        });
    });

    it("keeps other issues' drills when one issue's drills fetch fails", async () => {
        mockGetIssues.mockResolvedValue([issue(), issue({ id: "issue-2", title: "Over the top" })]);
        mockGetDrills.mockImplementation((issueId: string) =>
            issueId === "issue-1" ? Promise.reject(new Error("boom")) : Promise.resolve([drill({ id: "drill-2" })])
        );

        const { result } = await renderHook(() => useAnalysisIssueDetails("analysis-1"));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.detailsByIssueId["issue-1"].drills).toEqual([]);
        expect(result.current.detailsByIssueId["issue-2"].drills).toEqual([drill({ id: "drill-2" })]);
    });

    it("leaves the map empty when the issues fetch itself fails", async () => {
        mockGetIssues.mockRejectedValue(new Error("network"));

        const { result } = await renderHook(() => useAnalysisIssueDetails("analysis-1"));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.detailsByIssueId).toEqual({});
    });
});
