import { renderHook, waitFor } from "@testing-library/react-native";

import analysisService from "features/analysis/services/analysisService";
import useMarkAnalysisReviewed from "features/analysis/hooks/useMarkAnalysisReviewed";
import type { Analysis } from "features/analysis/types";

jest.mock("features/analysis/services/analysisService", () => ({
    __esModule: true,
    default: { markAnalysisReviewed: jest.fn() },
}));

const mockMark = analysisService.markAnalysisReviewed as jest.Mock;

const analysis = (over: Partial<Analysis> = {}): Analysis =>
    ({
        analysis_id: "analysis-1",
        reviewed_at: null,
        ...over,
    }) as Analysis;

describe("useMarkAnalysisReviewed", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("does nothing when there is no active analysis", async () => {
        await renderHook(({ active }: { active: Analysis | undefined }) => useMarkAnalysisReviewed(active), {
            initialProps: { active: undefined as Analysis | undefined },
        });
        expect(mockMark).not.toHaveBeenCalled();
    });

    it("does nothing when the active analysis is already reviewed", async () => {
        await renderHook(() => useMarkAnalysisReviewed(analysis({ reviewed_at: "2026-01-01T00:00:00Z" })));
        expect(mockMark).not.toHaveBeenCalled();
    });

    it("stamps an unreviewed active analysis once", async () => {
        mockMark.mockResolvedValue(undefined);
        await renderHook(() => useMarkAnalysisReviewed(analysis()));

        await waitFor(() => expect(mockMark).toHaveBeenCalledWith("analysis-1"));
        expect(mockMark).toHaveBeenCalledTimes(1);
    });

    it("does not call again for the same id across re-renders", async () => {
        mockMark.mockResolvedValue(undefined);
        const { rerender } = await renderHook(({ active }: { active: Analysis }) => useMarkAnalysisReviewed(active), {
            initialProps: { active: analysis() },
        });
        await waitFor(() => expect(mockMark).toHaveBeenCalledTimes(1));

        rerender({ active: analysis() });
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(mockMark).toHaveBeenCalledTimes(1);
    });

    it("retries once on failure, then logs and gives up silently", async () => {
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
        mockMark.mockRejectedValueOnce(new Error("network")).mockRejectedValueOnce(new Error("network"));

        await renderHook(() => useMarkAnalysisReviewed(analysis()));

        await waitFor(() => expect(mockMark).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(consoleError).toHaveBeenCalled());

        consoleError.mockRestore();
    });

    it("does not retry a second time when the retry succeeds", async () => {
        mockMark.mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce(undefined);

        await renderHook(() => useMarkAnalysisReviewed(analysis()));

        await waitFor(() => expect(mockMark).toHaveBeenCalledTimes(2));
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(mockMark).toHaveBeenCalledTimes(2);
    });
});
