import React from "react";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function statusStyles(statusRaw) {
  const status = (statusRaw || "").toString().toLowerCase();

  // Adjust these mappings to your actual backend statuses.
  if (["done", "completed", "complete", "success"].includes(status)) {
    return {
      pill: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
      dot: "bg-emerald-400",
      label: statusRaw || "Completed",
    };
  }

  if (["processing", "running", "in_progress", "pending"].includes(status)) {
    return {
      pill: "bg-amber-500/15 text-amber-200 border-amber-500/30",
      dot: "bg-amber-400",
      label: statusRaw || "Processing",
    };
  }

  if (["failed", "error"].includes(status)) {
    return {
      pill: "bg-red-500/15 text-red-200 border-red-500/30",
      dot: "bg-red-400",
      label: statusRaw || "Failed",
    };
  }

  return {
    pill: "bg-slate-500/15 text-slate-200 border-slate-500/30",
    dot: "bg-slate-300",
    label: statusRaw || "Unknown",
  };
}

/**
 * AnalysisCard
 * - Use as a clickable "list item" (default) or as a static card (interactive=false).
 */
export default function AnalysisCard({
  title = "Analysis",
  drillName = "",
  status = "",
  createdAt = null,
  selected = false,
  onClick,
  interactive = true,
  compact = false,
  rightSlot = null,
  className = "",
}) {
  const st = statusStyles(status);

  const base =
    "w-full text-left rounded-2xl border transition " +
    "bg-slate-900/70 backdrop-blur-sm shadow-lg " +
    "hover:bg-slate-900/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70";

  const selectedCls = selected
    ? "border-blue-500/70 ring-1 ring-blue-500/40"
    : "border-slate-700/60";

  const padding = compact ? "p-4" : "p-5 sm:p-6";

  const content = (
    <div className={`${base} ${selectedCls} ${padding} ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-slate-100 truncate">
              {title}
            </h3>

            <span
              className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs border ${st.pill}`}
              title={st.label}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
              <span className="truncate">{st.label}</span>
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
            {drillName ? (
              <span className="truncate">
                <span className="text-slate-300/90">Drill:</span> {drillName}
              </span>
            ) : null}

            <span>
              <span className="text-slate-300/90">Created:</span>{" "}
              {formatDate(createdAt)}
            </span>
          </div>
        </div>

        {rightSlot ? (
          <div className="shrink-0">{rightSlot}</div>
        ) : (
          <div className="shrink-0 text-slate-400/80">
            {/* subtle chevron */}
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );

  if (!interactive) return content;

  return (
    <button type="button" onClick={onClick} className="w-full">
      {content}
    </button>
  );
}
