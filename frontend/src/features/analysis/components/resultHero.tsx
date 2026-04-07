import { useState } from "react";
import { AlertTriangle, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { Issue } from "@/features/issues/types";
import InfoPopup from "./popup";
import { InfoButton } from "./InfoButton";

interface ResultHeroCardProps {
  prioNumber?: number;
  totalIssues?: number;
  issue: Issue;
  onClickDrill?: () => void;
  onNextIssue: () => void;
  onPreviousIssue: () => void;
}

export default function ResultHeroCard({
  prioNumber = 0,
  totalIssues = 0,
  issue,
  onClickDrill,
  onNextIssue,
  onPreviousIssue,
}: ResultHeroCardProps) {
  const [activePopup, setActivePopup] = useState<"happening" | "feel" | null>(null);

  return (
    <>
      <section
        className="w-full md:px-4 md:py-6 flex justify-center max-sm:px-0"
        aria-label="Top priority summary"
      >
        <div className="relative w-full overflow-hidden rounded-3xl h-fit sm:h-auto">
          <div className="relative rounded-3xl bg-[#0e1428]/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] p-3 sm:p-8 min-h-[450px] sm:min-h-[300px] flex flex-col">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                <span className="text-xs uppercase tracking-widest text-slate-300">
                  Summary
                </span>
              </div>

              <div className="inline-flex items-baseline gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
                <span className="text-xs uppercase tracking-widest text-slate-400">
                  Priority
                </span>
                <span className="text-sm font-semibold text-slate-100">
                  #{prioNumber}
                </span>
              </div>
            </div>

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

            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              {issue.current_motion && (
                <InfoButton
                  title="What’s happening"
                  subtitle="Tap to see the current swing pattern"
                  tone="amber"
                  icon={<AlertTriangle size={18} />}
                  onClick={() => setActivePopup("happening")}
                />
              )}

              {issue.expected_motion && (
                <InfoButton
                  title="What to feel instead"
                  subtitle="Tap to see the motion you want"
                  tone="emerald"
                  icon={<Sparkles size={18} />}
                  onClick={() => setActivePopup("feel")}
                />
              )}
            </div>

            <div className="mt-auto border-t border-white/10 pt-6">
              <div className="flex flex-col gap-3">
                {onClickDrill && (
                  <button
                    type="button"
                    className="w-full rounded-2xl bg-emerald-500/90 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-emerald-900/30 transition-colors hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    onClick={onClickDrill}
                  >
                    Start Practice #{prioNumber}
                  </button>
                )}

                <div className="flex w-full items-center gap-3">
                  <button
                    type="button"
                    onClick={onPreviousIssue}
                    disabled={prioNumber <= 1}
                    className="group flex h-14 flex-1 items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 transition-all duration-200 hover:border-white/15 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-200">
                        <ChevronLeft size={18} />
                      </div>
                      <span className="text-sm font-semibold text-slate-100">Previous</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={onNextIssue}
                    disabled={prioNumber >= totalIssues}
                    className="group flex h-14 flex-1 items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 transition-all duration-200 hover:border-white/15 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="text-sm font-semibold text-slate-100">Next</span>
                    <div className="ml-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-200">
                      <ChevronRight size={18} />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <InfoPopup
        open={activePopup === "happening"}
        onClose={() => setActivePopup(null)}
        title="What’s happening"
        text={issue.current_motion ?? ""}
        tone="amber"
        icon={<AlertTriangle size={18} />}
      />

      <InfoPopup
        open={activePopup === "feel"}
        onClose={() => setActivePopup(null)}
        title="What to feel instead"
        text={issue.expected_motion ?? ""}
        tone="emerald"
        icon={<Sparkles size={18} />}
      />
    </>
  );
}