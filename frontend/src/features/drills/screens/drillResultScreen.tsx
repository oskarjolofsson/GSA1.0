import { DrillRun } from "../types";

// Components
import DrillResults from "../components/resultsPage/drillResults";
import IssueResults from "../components/resultsPage/issueResults";

export default function DrillResultsScreen() {
    const mockDrillRuns: DrillRun[] = [
        { id: "drill1", session_id: "session1", drill_id: "drill1", status: "completed", successful_reps: 7, failed_reps: 5, skipped: false, started_at: new Date(), completed_at: new Date(),
        },
        { id: "drill2", session_id: "session1", drill_id: "drill2", status: "completed", successful_reps: 9, failed_reps: 3, skipped: false, started_at: new Date(), completed_at: new Date(),
        },
        { id: "drill3", session_id: "session1", drill_id: "drill3", status: "completed", successful_reps: 10, failed_reps: 2, skipped: false, started_at: new Date(), completed_at: new Date(),
        },
    ]


    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-6 md:py-8 animate-fade-in
                min-h-[100dvh] flex flex-col justify-center gap-6
                sm:min-h-0 sm:block">
            <div className="mb-6 md:mb-8 mt-6 md:mt-2 text-center">
                <h1 className="text-2xl md:text-3xl font-semibold text-slate-100">Practice Results</h1>
                <p className="mt-2 text-sm text-slate-400">Summary of your practice session.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                <DrillResults drillRuns={mockDrillRuns} />
                <IssueResults drillRuns={mockDrillRuns} />
            </div>
        </div>
    );
}