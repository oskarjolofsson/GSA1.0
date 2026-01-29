

export default function PrimaryActionCard() {
  const issue = {
    id: 1,
    title: "Over the Top",
    progress: 70,
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 shadow-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.12),transparent_60%)]" />
      <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex-1 space-y-4">
          <h2 className="text-2xl font-semibold text-white">
            {issue.title}
          </h2>
          <div className="space-y-2">
            <div className="h-2 w-full rounded-full bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${issue.progress}%` }}
              />
            </div>
            <p className="text-sm text-slate-400">
              {issue.progress}% completed
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <button className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 transition">
            Continue Practice
          </button>
        </div>
      </div>
    </div>
  )
}
