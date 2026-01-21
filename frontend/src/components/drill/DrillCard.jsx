import React, { useState } from "react";

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

export default function DrillCard({
  drill,
  isActive = false,
  onClick,
  createdAt,
  status = "",
  compact = false,
  className = "",
}) {
  const [counter, setCounter] = useState(0);  // Initialize counter state
  const st = statusStyles(status);

  const base =
    "w-full text-left rounded-2xl border transition " +
    "bg-slate-900/70 backdrop-blur-sm shadow-lg " +
    "hover:bg-slate-900/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70";

  const selectedCls = isActive
    ? "border-blue-500/70 ring-1 ring-blue-500/40"
    : "border-slate-700/60";

  const padding = compact ? "p-4" : "p-5 sm:p-6";

  const handleIncrement = () => {
    if (counter < 5) setCounter(counter + 1);  // Increment if less than 5
  };

  const handleDecrement = () => {
    if (counter > 0) setCounter(counter - 1);  // Decrement if greater than 0
  };

  const content = (
    <div className={`${base} ${selectedCls} ${padding} ${className}`}>
      <div className="flex items-start justify-between gap-4">
        {/* Image Section */}
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-slate-700/40 border border-white/5 shadow-lg transition-all duration-300 ease-out group-hover:scale-110">
          {drill?.thumbnailUrl ? (
            <img
              src={drill.thumbnailUrl}
              alt={drill?.name ? `${drill.name} thumbnail` : "Drill thumbnail"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full grid place-items-center text-xs text-slate-300">
              No image available
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-slate-100 truncate">
              {drill?.name || "Untitled Drill"}
            </h3>

            {/* Status Indicator */}
            <span
              className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs border ${st.pill}`}
              title={st.label}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
              <span className="truncate">{st.label}</span>
            </span>

            {/* Counter next to the "Unknown" label */}
            {st.label === "Unknown" && (
              <span
                className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs border ${st.pill}`}
                title={`Counter: ${counter}/5`}
              >
                <span className="truncate">{counter}/5</span>
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
            {drill?.drill ? (
              <span className="truncate">
                <span className="text-slate-300/90">Drill:</span> {drill?.drill}
              </span>
            ) : null}

            <span>
              <span className="text-slate-300/90">Created:</span>{" "}
              {formatDate(createdAt)}
            </span>
          </div>

          {/* Counter Buttons */}
          {st.label === "Unknown" && (
            <div className="mt-4 flex items-center gap-4">
              <div className="flex gap-2">
                {/* Increment Button */}
                <button
                  onClick={handleIncrement}
                  className="px-3 py-1 rounded-full bg-green-500 text-white hover:bg-green-600 transition-all"
                >
                  +1
                </button>
                {/* Decrement Button */}
                <button
                  onClick={handleDecrement}
                  className="px-3 py-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all"
                >
                  -1
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 text-slate-400/80">
          {/* Subtle chevron */}
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
      </div>
    </div>
  );

  if (!onClick) return content;

  return (
    <button type="button" onClick={onClick} className="w-full">
      {content}
    </button>
  );
}
