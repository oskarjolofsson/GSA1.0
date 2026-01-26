import { Eye, TrendingDown } from "lucide-react";

export default function ResultHeroCard({
  prioNumber = 1,
  problemName = "Hanging Back",
  diagnosis = "You keep your weight on your trail foot instead of shifting forward.",
  impactLine = "This typically reduces compression and consistency.",
  onClickDrill,
  onNextDrill,
  onPreviousDrill
}) {
  return (
    <section className="w-full px-4 py-6 flex justify-center max-sm:px-0" aria-label="Top priority summary">
      <div className="relative w-full overflow-hidden rounded-3xl h-fit sm:h-auto">
        {/* Card */}
        <div className="relative rounded-3xl bg-[#0e1428]/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] p-6 sm:p-8 min-h-[450px]  sm:min-h-[300px] flex flex-col">
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
          <h2 className="text-2xl sm:text-3xl leading-tight font-bold text-slate-100 mb-4 text-center">
            {problemName}
          </h2>

          {/* Body */}
          <div className="mb-6 space-y-5">
            <div className="inline-flex items-center gap-2 text-sm text-slate-400">
              <Eye size={20} />
              <p className="text-sm sm:text-base leading-relaxed text-slate-400">
                {diagnosis}
              </p>
            </div>

            <div className="inline-flex items-center gap-2 text-sm text-slate-400">
              <TrendingDown size={20} />
              <p className="text-sm sm:text-base leading-relaxed text-slate-400 border-t border-white/5 pt-4">
                {impactLine}
              </p>
            </div>

          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-6 max-sm:flex-col max-sm:items-stretch">
            <button
              type="button"
              className="whitespace-nowrap rounded-xl bg-emerald-500/90 hover:bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300"
              onClick={onClickDrill}
            >
              Start Fix #{prioNumber}
            </button>

            <div className="flex items-center justify-end gap-3 max-sm:justify-center">

              {onPreviousDrill && (
                <button
                  type="button"
                  className="text-xs font-medium text-slate-400 hover:text-slate-200 px-3 py-1 rounded-lg hover:bg-white/5 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-slate-500"
                  onClick={onPreviousDrill}
                >
                  Previous
                </button>
              )}


              {onNextDrill && (
                <button
                  type="button"
                  className="text-xs font-medium text-slate-400 hover:text-slate-200 px-3 py-1 rounded-lg hover:bg-white/5 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-slate-500"
                  onClick={onNextDrill}
                >
                  Next
                </button>
              )}



            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
