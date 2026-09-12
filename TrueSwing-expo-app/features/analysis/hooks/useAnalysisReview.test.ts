import { act, renderHook, waitFor } from "@testing-library/react-native";

import analysisService from "features/analysis/services/analysisService";
import useAnalysisReview from "features/analysis/hooks/useAnalysisReview";
import type { AnalysisIssue } from "features/analysis/types";

jest.mock("features/analysis/services/analysisService", () => ({
    __esModule: true,
    default: { dismissAnalysisIssue: jest.fn() },
}));

const mockDismiss = analysisService.dismissAnalysisIssue as jest.Mock;

const issue = (over: Partial<AnalysisIssue> = {}): AnalysisIssue => ({
    analysis_issue_id: "ai-1",
    analysis_id: "analysis-1",
    issue_id: "issue-1",
    confidence: 0.8,
    created_at: "2026-01-01T00:00:00Z",
    ...over,
});

describe("useAnalysisReview", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("starts empty when there are no issues", async () => {
        const { result } = await renderHook(() => useAnalysisReview([]));
        expect(result.current.issues).toEqual([]);
    });

    it("removes an issue immediately and keeps it removed on success", async () => {
        mockDismiss.mockResolvedValue(undefined);
        const { result } = await renderHook(() => useAnalysisReview([issue()]));

        await act(() => result.current.reject("ai-1"));

        // Optimistic: gone before the promise even resolves.
        expect(result.current.issues).toEqual([]);
        await waitFor(() => expect(mockDismiss).toHaveBeenCalledWith("ai-1"));
        expect(result.current.issues).toEqual([]);
    });

    it("re-adds the issue with an error flag when the dismiss call fails", async () => {
        mockDismiss.mockRejectedValue(new Error("network"));
        const { result } = await renderHook(() => useAnalysisReview([issue()]));

        await act(() => result.current.reject("ai-1"));

        await waitFor(() => expect(result.current.issues).toHaveLength(1));
        expect(result.current.issues[0]).toMatchObject({ analysis_issue_id: "ai-1", rejectFailed: true });
    });

    it("succeeds on retry after a failed reject", async () => {
        mockDismiss.mockRejectedValueOnce(new Error("network"));
        mockDismiss.mockResolvedValueOnce(undefined);
        const { result } = await renderHook(() => useAnalysisReview([issue()]));

        await act(() => result.current.reject("ai-1"));
        await waitFor(() => expect(result.current.issues).toHaveLength(1));
        expect(result.current.issues[0].rejectFailed).toBe(true);

        await act(() => result.current.reject("ai-1"));
        expect(result.current.issues).toEqual([]);
        await waitFor(() => expect(mockDismiss).toHaveBeenCalledTimes(2));
        expect(result.current.issues).toEqual([]);
    });
});
