import { DrillRun } from "../../types";


export default function IssueResults({ drillRuns }: { drillRuns: DrillRun[] }) {
    
    const issueTotals = drillRuns.reduce(
        (acc, result) => {
            const attempted = result.successful_reps + result.failed_reps;
            return {
                total: acc.total + 12,
                success: acc.success + result.successful_reps,
                failed: acc.failed + result.failed_reps,
                attempted: acc.attempted + attempted,
            };
        },
        { total: 0, success: 0, failed: 0, attempted: 0 },
    );

    const issueRemaining = Math.max(issueTotals.total - issueTotals.attempted, 0);
    const issueCompletionPercent =
        issueTotals.total > 0 ? Math.round((issueTotals.attempted / issueTotals.total) * 100) : 0;
    const issueSuccessRate =
        issueTotals.attempted > 0 ? Math.round((issueTotals.success / issueTotals.attempted) * 100) : 0;
    const issueSuccessWidth = issueTotals.total > 0 ? (issueTotals.success / issueTotals.total) * 100 : 0;
    const issueFailedWidth = issueTotals.total > 0 ? (issueTotals.failed / issueTotals.total) * 100 : 0;
    const issueRemainingWidth = issueTotals.total > 0 ? (issueRemaining / issueTotals.total) * 100 : 0;


    return (
        <aside className="rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-sm shadow-xl p-4 md:p-6 h-fit">
            <h2 className="text-lg md:text-xl font-semibold text-slate-100">Total</h2>
            <p className="mt-1 text-sm text-slate-400">Overall result of all drills in this practice</p>

            <div className="mt-5 rounded-xl border border-slate-700/60 bg-slate-800/70 p-4">
                <div className="flex items-end justify-between">
                    <p className="text-sm text-slate-400">Succeded</p>
                    <p className="text-2xl font-semibold text-slate-100">{issueSuccessRate}%</p>
                </div>

                <div className="mt-3 h-3.5 w-full overflow-hidden rounded-full bg-slate-700">
                    <div className="h-full flex">
                        <div
                            className="h-full bg-gradient-to-r from-green-600 to-green-500"
                            style={{ width: `${issueSuccessWidth}%` }}
                        />
                        <div
                            className="h-full bg-gradient-to-r from-red-600 to-red-500"
                            style={{ width: `${issueFailedWidth}%` }}
                        />
                        <div
                            className="h-full bg-slate-600"
                            style={{ width: `${issueRemainingWidth}%` }}
                        />
                    </div>
                </div>

                <div className="mt-2 flex text-xs font-medium sm:hidden">
                    <div style={{ width: `${issueSuccessWidth}%` }} className="text-center text-green-300">
                        {issueTotals.success > 0 ? issueTotals.success : null}
                    </div>
                    <div style={{ width: `${issueFailedWidth}%` }} className="text-center text-red-300">
                        {issueTotals.failed > 0 ? issueTotals.failed : null}
                    </div>
                    <div style={{ width: `${issueRemainingWidth}%` }} className="text-center text-slate-300">
                        {issueRemaining > 0 ? issueRemaining : null}
                    </div>
                </div>

                <div className="hidden sm:grid mt-4 grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-2 text-sm">
                    <div className="rounded-lg bg-green-500/10 border border-green-500/30 px-3 py-2 text-green-300">
                        Success: {issueTotals.success}
                    </div>
                    <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-red-300">
                        Failed: {issueTotals.failed}
                    </div>
                    <div className="rounded-lg bg-slate-700/60 border border-slate-600/70 px-3 py-2 text-slate-300">
                        Remaining: {issueRemaining}
                    </div>
                </div>

                <p className="mt-4 text-xs text-slate-400">
                    Success rate on attempted drills: <span className="text-slate-200 font-medium">{issueSuccessRate}%</span>
                </p>
            </div>
        </aside>
    )
}