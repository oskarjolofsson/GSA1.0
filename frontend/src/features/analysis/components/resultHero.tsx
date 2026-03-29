import { Eye, Star, AlertTriangle, Sparkles } from "lucide-react";
import { Issue } from "@/features/issues/types";

interface ResultHeroCardProps {
  prioNumber?: number;
  totalIssues?: number;
  issue: Issue;
  onClickDrill: () => void;
  onNextIssue: () => void;
  onPreviousIssue: () => void;
}

export default function ResultHeroCard({
  prioNumber = 0,
  totalIssues = 0,
  issue,
  onClickDrill,
  onNextIssue,
  onPreviousIssue
}: ResultHeroCardProps) {
  return (
    <section className="w-full md:px-4 md:py-6 flex justify-center max-sm:px-0" aria-label="Top priority summary">
      <div className="relative w-full overflow-hidden rounded-3xl h-fit sm:h-auto">
        {/* Card */}
        <div className="relative rounded-3xl bg-[#0e1428]/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] p-3 sm:p-8 min-h-[450px]  sm:min-h-[300px] flex flex-col">
          {/* Top row */}
          <div className="flex items-center justify-between gap-3 mb-4">
            {/* Kicker */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              <span
                className="h-2 w-2 rounded-full bg-emerald-500"
                aria-hidden="true"
              />
              <span className="text-xs uppercase tracking-widest text-slate-300">
                Summary
              </span>
            </div>

            {/* Priority pill */}
            <div className="inline-flex items-baseline gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
              <span className="text-xs uppercase tracking-widest text-slate-400">
                Priority
              </span>
              <span className="text-sm font-semibold text-slate-100">
                #{prioNumber}
              </span>
            </div>
          </div>

          {/* Title */}
          <div className="mb-4 text-center sm:mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
              {issue.title}
            </h2>

            {issue.description && (
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:mt-3 sm:text-base sm:leading-7">
                {issue.description}
              </p>
            )}
          </div>

          {/* Main content */}
          <div className="space-y-3 sm:space-y-4">
            {issue.current_motion && (
              <section className="rounded-xl border border-amber-400/15 bg-amber-400/5 p-3 sm:rounded-2xl sm:p-5">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/15 text-amber-300 sm:h-8 sm:w-8">
                    <AlertTriangle size={14} className="sm:hidden" />
                    <AlertTriangle size={16} className="hidden sm:block" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200/80 sm:text-[11px] sm:tracking-[0.18em]">
                      What’s happening
                    </p>
                  </div>
                </div>

                <p className="pl-9 text-sm leading-6 text-slate-200 sm:pl-10 sm:text-base sm:leading-7">
                  {issue.current_motion}
                </p>
              </section>
            )}

            {issue.expected_motion && (
              <section className="rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-3 sm:rounded-2xl sm:p-5">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300 sm:h-8 sm:w-8">
                    <Sparkles size={14} className="sm:hidden" />
                    <Sparkles size={16} className="hidden sm:block" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200/80 sm:text-[11px] sm:tracking-[0.18em]">
                      What to feel instead
                    </p>
                  </div>
                </div>

                <p className="pl-9 text-sm leading-6 text-slate-200 sm:pl-10 sm:text-base sm:leading-7">
                  {issue.expected_motion}
                </p>
              </section>
            )}
          </div>


          {/* Actions */}
          <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-6 max-sm:flex-col max-sm:items-stretch">
            <button
              type="button"
              className="whitespace-nowrap rounded-xl bg-emerald-500/90 hover:bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300"
              onClick={onClickDrill}
            >
              Start Practice #{prioNumber}
            </button>

            <div className="flex items-center justify-end gap-3 max-sm:justify-center">

              <button
                type="button"
                className="text-xs font-medium text-slate-400 hover:text-slate-200 px-3 py-1 rounded-lg hover:bg-white/5 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-slate-500"
                onClick={onPreviousIssue}
                disabled={prioNumber <= 1}
              >
                Previous
              </button>

              <button
                type="button"
                className="text-xs font-medium text-slate-400 hover:text-slate-200 px-3 py-1 rounded-lg hover:bg-white/5 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-slate-500"
                onClick={onNextIssue}
                disabled={prioNumber >= totalIssues}
              >
                Next
              </button>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


function formatPhase(phase: string | null) {
  if (!phase) return "Swing Issue";

  return phase
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getConfidenceLabel(confidence?: number) {
  if (confidence == null) return null;
  const percent = Math.round(confidence * 100);

  if (percent >= 85) return `High confidence`;
  if (percent >= 65) return `Medium confidence`;
  return `Low confidence`;
}

function splitTags(value: string | null) {
  if (!value) return [];

  return value
    .split(/[•,|/]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);
}

