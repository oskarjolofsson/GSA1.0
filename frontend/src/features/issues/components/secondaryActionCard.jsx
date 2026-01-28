export default function SecondaryActionCard() {
  const issue = {
    id: 2,
    title: "Early Extension",
    progress: 45,
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950/50 to-slate-900/50 border border-slate-700/20 shadow-md">
      
      {/* Subtle background glow - more faded */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.05),transparent_60%)]" />

      <div className="relative p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Left content */}
        <div className="flex-1 space-y-3">

          <h2 className="text-lg font-medium text-white/80">
            {issue.title}
          </h2>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="h-1.5 w-full rounded-full bg-slate-700/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400/60 transition-all duration-500"
                style={{ width: `${issue.progress}%` }}
              />
            </div>

            <p className="text-xs text-slate-500">
              {issue.progress}% completed
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="shrink-0">
          <button className="inline-flex items-center justify-center rounded-lg bg-slate-700/40 hover:bg-slate-700/60 px-4 py-2 text-xs font-medium text-slate-300 transition">
            Practice
          </button>
        </div>

      </div>
    </div>
  )
}
