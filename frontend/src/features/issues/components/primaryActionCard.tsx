import { Issue } from "@/features/issues/types"
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

export default function PrimaryActionCard({ issue }: { issue: Issue }) {
  const navigate = useNavigate();

  const progressPercent = Math.round((issue.progress?.recent_session_success_rates ?? 0) * 100);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 shadow-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.12),transparent_60%)]" />
      <button
        className="absolute top-3 right-3 z-10 inline-flex items-center justify-center w-12 h-6 text-slate-400 hover:text-red-400 text-[8px] border border-slate-600/40 hover:border-red-400/50 rounded-full transition-all duration-200"
        aria-label="Delete or mark as done"
      >
        Remove
      </button>
      
      <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex-1 space-y-4">
          <h2 className="text-2xl font-semibold text-white">
            {issue.title}
          </h2>
          <div className="space-y-2">
            <div className="h-2 w-full rounded-full bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-sm text-slate-400">
              {progressPercent}% Success Rate ({issue.progress?.completed_sessions ?? 0} sessions completed)
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <button
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 transition"
            onClick={() => navigate(`/dashboard/drills/?issueId=${issue.id}`)}
          >
            Continue Practice
          </button>
        </div>
      </div>
    </div>
  )
}
