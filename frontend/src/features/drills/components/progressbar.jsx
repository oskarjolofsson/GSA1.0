import NumberFlow from '@number-flow/react'

export default function SuccessFailureProgress({ succeeded, failed, total }) {
  const succeededPercent =
    total > 0 ? Math.round((succeeded / total) * 100) : 0;
  const failedPercent =
    total > 0 ? Math.round((failed / total) * 100) : 0;

  return (
    <div className="w-full mb-2">
      {/* Card container */}
      <div className="rounded-xl border border-neutral-700 bg-neutral-800/50 px-6 py-2">
        <div className="flex items-center justify-between mb-4">
          {/* Success section */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-sm font-bold transition-all duration-500">
              <NumberFlow value={succeeded} duration={500} />
            </div>
            <div>
              <div className="text-sm font-medium text-green-400">Success</div>
              <div className="text-xs text-neutral-400 transition-all duration-500"><NumberFlow value={succeededPercent} />%</div>
            </div>
          </div>

          {/* Total in center */}
          <div className="text-center">
            <div className="text-2xl font-semibold text-slate-100 transition-all duration-500">
              <NumberFlow value={succeeded + failed} duration={500} /> / <NumberFlow value={total} />
            </div>
            <div className="text-xs text-neutral-400">Completed</div>
          </div>

          {/* Failed section */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-red-400">Failed</div>
              <div className="text-xs text-neutral-400 transition-all duration-500"><NumberFlow value={failedPercent} />%</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-sm font-bold transition-all duration-500">
              <NumberFlow value={failed} duration={500} />
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative w-full h-3 bg-neutral-700 rounded-full overflow-hidden">
          {/* Green from left */}
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-600 to-green-500 transition-all duration-700 ease-out"
            style={{ width: `${succeededPercent}%` }}
          />

          {/* Red from right */}
          <div
            className="absolute top-0 right-0 h-full bg-gradient-to-l from-red-600 to-red-500 transition-all duration-700 ease-out"
            style={{ width: `${failedPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}