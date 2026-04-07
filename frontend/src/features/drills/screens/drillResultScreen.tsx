import { DrillRun } from "../types";

// Components
import DrillResults from "../components/resultsPage/drillResults";
import IssueResults from "../components/resultsPage/issueResults";
import NextIssue from "../components/resultsPage/nextIssue";
import { useSearchParams } from "react-router-dom";
import { usePracticeResultsState } from "../hooks/usePracticeResultsState";
import { useIssue } from "@/features/issues/hooks/useUserIssues";
import { ErrorState } from "@/shared/components/cards/error";
import { LoadingState } from "@/shared/components/cards/loading";

export default function DrillResultsScreen() {
    const [searchParams] = useSearchParams();
    const sessionId: string | null = searchParams.get('sessionId');
    const drillRuns: DrillRun[] = usePracticeResultsState({ sessionId }).DrillRuns;
    const { issues, loading, error } = useIssue();
    const nextIssue = [...issues].sort((a, b) => {
        const rateA = a.progress?.recent_session_success_rates ?? 0;
        const rateB = b.progress?.recent_session_success_rates ?? 0;
        return rateA - rateB; // Minst först
    })[0];

    if (loading) {
        return (
            <LoadingState
                title="Loading Practice Results"
                message="Fetching your practice results..."
            />
        );
    }

    if (error) {
        return (
            <ErrorState
                title="Failed to Load Practice Results"
                error={new Error(error)}
                onRetry={() => window.location.reload()}
            />
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-6 md:py-8 animate-fade-in
                min-h-[100dvh] flex flex-col justify-center gap-6
                sm:min-h-0 sm:block">
            <div className="mb-3 md:mb-8 mt-6 md:mt-2 text-center">
                <h1 className="text-2xl md:text-3xl font-semibold text-slate-100">Practice Results</h1>
                <p className="mt-2 text-sm text-slate-400">Summary of your practice session.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-center justify-center">

                <DrillResults drillRuns={drillRuns} />
                {/* <IssueResults drillRuns={drillRuns} /> */}
                <NextIssue issue={nextIssue} />
            </div>
        </div>
    );
}