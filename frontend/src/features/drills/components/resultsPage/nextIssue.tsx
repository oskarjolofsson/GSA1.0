import { Issue } from "@/features/issues/types";
import { useNavigate } from "react-router-dom";

interface NextIssueProps {
    issue: Issue;
    onPractice?: (issue: Issue) => void;
}

export default function NextIssue({ issue, onPractice }: NextIssueProps) {
    const navigate = useNavigate();

    const progressRate = issue?.progress?.recent_session_success_rates ?? issue?.progress?.overall_success_rate ?? 0;
    const progressPercent = Math.max(0, Math.min(100, Math.round(progressRate * 100)));
    const sessionsCompleted = issue?.progress?.completed_sessions ?? 0;

    const handlePractice = () => {
        if (onPractice) {
            onPractice(issue);
            return;
        }
        navigate(`/dashboard/drills/?issueId=${issue.id}`);
    };

    return (
        <aside className="rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-sm shadow-xl p-4 md:p-6 h-fit min-h-[220px] flex flex-col">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-slate-100 line-clamp-2">
                Continue Practice:
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">{issue.title}</p>

            <div className="mt-4 rounded-xl border border-slate-700/60 bg-slate-800/70 p-3 sm:p-4">
                <div className="flex items-end justify-between">
                    <p className="text-xs sm:text-sm text-slate-400">Success rate</p>
                    <p className="text-xl sm:text-2xl font-semibold text-slate-100">{progressPercent}%</p>
                </div>

                <div className="mt-3 h-2.5 sm:h-3.5 w-full overflow-hidden rounded-full bg-slate-700">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                <p className="mt-3 text-xs sm:text-sm text-slate-300">
                    {sessionsCompleted} session{sessionsCompleted === 1 ? "" : "s"} completed
                </p>
            </div>

            <button
                onClick={handlePractice}
                className="mt-auto pt-4 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm sm:text-base font-semibold text-white shadow-lg hover:bg-emerald-500 transition-colors hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 disabled:bg-emerald-400 disabled:cursor-not-allowed hover:cursor-pointer"
            >
                Practice
            </button>
        </aside>
    )
}