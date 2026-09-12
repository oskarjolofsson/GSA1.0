import { fireEvent, render } from "@testing-library/react-native";

import AnalysisResultsReview from "./AnalysisResultsReview";
import useAnalysisReview from "../hooks/useAnalysisReview";
import useAnalysisIssueDetails from "../hooks/useAnalysisIssueDetails";
import type { AnalysisIssue } from "../types";

jest.mock("../hooks/useAnalysisReview");
jest.mock("../hooks/useAnalysisIssueDetails");

const mockUseAnalysisReview = useAnalysisReview as jest.Mock;
const mockUseAnalysisIssueDetails = useAnalysisIssueDetails as jest.Mock;

const issue = (over: Partial<AnalysisIssue> = {}): AnalysisIssue => ({
    analysis_issue_id: "ai-1",
    analysis_id: "analysis-1",
    issue_id: "issue-1",
    confidence: 0.8,
    created_at: "2026-01-01T00:00:00Z",
    ...over,
});

describe("AnalysisResultsReview", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default: details already loaded, matching the common case in tests below.
        mockUseAnalysisIssueDetails.mockReturnValue({ detailsByIssueId: {}, loading: false });
    });

    it("shows a loading placeholder per card before details land", async () => {
        mockUseAnalysisReview.mockReturnValue({ issues: [issue()], reject: jest.fn() });
        mockUseAnalysisIssueDetails.mockReturnValue({ detailsByIssueId: {}, loading: true });

        const view = await render(
            <AnalysisResultsReview issues={[]} analysisId="analysis-1" onNext={jest.fn()} onBack={jest.fn()} />
        );
        expect(view.queryByText("Early extension")).toBeNull();
        expect(view.queryByText(/confidence/)).toBeNull();
    });

    it("renders a populated card once details land for its issue_id", async () => {
        mockUseAnalysisReview.mockReturnValue({ issues: [issue(), issue({ analysis_issue_id: "ai-2", issue_id: "issue-2" })], reject: jest.fn() });
        mockUseAnalysisIssueDetails.mockReturnValue({
            detailsByIssueId: {
                "issue-1": { title: "Early extension", description: "You're standing up.", drills: [{ id: "d1", title: "Wall drill" }] },
            },
            loading: false,
        });

        const view = await render(
            <AnalysisResultsReview issues={[]} analysisId="analysis-1" onNext={jest.fn()} onBack={jest.fn()} />
        );
        expect(view.getByText("Early extension")).toBeTruthy();
        expect(view.getByText(/Wall drill/)).toBeTruthy();
        // issue-2 has no details yet and loading is false — falls back to confidence.
        expect(view.getByText(/confidence/)).toBeTruthy();
    });

    it("shows the reused empty-state copy and no cards when there are no issues", async () => {
        mockUseAnalysisReview.mockReturnValue({ issues: [], reject: jest.fn() });

        const view = await render(
            <AnalysisResultsReview issues={[]} analysisId="analysis-1" onNext={jest.fn()} onBack={jest.fn()} />
        );
        expect(view.getByText("No issues found for this analysis.")).toBeTruthy();
    });

    it("calls the hook's reject with the tapped issue's id", async () => {
        const reject = jest.fn();
        mockUseAnalysisReview.mockReturnValue({ issues: [issue()], reject });

        const view = await render(
            <AnalysisResultsReview issues={[]} analysisId="analysis-1" onNext={jest.fn()} onBack={jest.fn()} />
        );
        await fireEvent.press(view.getByText("Reject"));
        expect(reject).toHaveBeenCalledWith("ai-1");
    });

    it("Continue always calls onNext", async () => {
        mockUseAnalysisReview.mockReturnValue({ issues: [], reject: jest.fn() });
        const onNext = jest.fn();

        const view = await render(
            <AnalysisResultsReview issues={[]} analysisId="analysis-1" onNext={onNext} onBack={jest.fn()} />
        );
        await fireEvent.press(view.getByText("Continue"));
        expect(onNext).toHaveBeenCalled();
    });
});
