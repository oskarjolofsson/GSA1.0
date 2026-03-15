import { DrillRun } from "../types";

// Components
import DrillResults from "../components/resultsPage/drillResults";
import IssueResults from "../components/resultsPage/issueResults";
import { useSearchParams } from "react-router-dom";
import { usePracticeResultsState } from "../hooks/usePracticeResultsState";

export default function DrillResultsScreen() {
    const [searchParams] = useSearchParams();
    const sessionId: string | null = searchParams.get('sessionId');
    const drillRuns: DrillRun[] = usePracticeResultsState({ sessionId }).DrillRuns;

    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-6 md:py-8 animate-fade-in
                min-h-[100dvh] flex flex-col justify-center gap-6
                sm:min-h-0 sm:block">
            <div className="mb-6 md:mb-8 mt-6 md:mt-2 text-center">
                <h1 className="text-2xl md:text-3xl font-semibold text-slate-100">Practice Results</h1>
                <p className="mt-2 text-sm text-slate-400">Summary of your practice session.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                <DrillResults drillRuns={drillRuns} />
                <IssueResults drillRuns={drillRuns} />
            </div>
        </div>
    );
}