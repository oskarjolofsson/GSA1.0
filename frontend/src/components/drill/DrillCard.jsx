import React from "react";

export default function DrillCard({
  drill,
  isActive = false,
  onClick,
  showFull = false,
}) {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`
        w-full text-left
        rounded-2xl border transition
        ${onClick ? "cursor-pointer" : "cursor-default"}
        ${
          isActive
            ? "border-blue-500 bg-blue-600/10"
            : "border-slate-700/60 bg-slate-800/60 hover:bg-slate-800/80"
        }
      `}
    >
      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-slate-700/40 border border-white/5">
          {drill?.thumbnailUrl ? (
            <img
              src={drill.thumbnailUrl}
              alt={drill?.name ? `${drill.name} thumbnail` : "Drill thumbnail"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full grid place-items-center text-xs text-slate-300">
              No image
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold text-slate-100 truncate">
                {drill?.name || "Untitled Drill"}
              </div>
              {!showFull && (
                <div className="text-sm text-slate-400 truncate mt-1">
                  {drill?.drill || ""}
                </div>
              )}
            </div>

            {isActive && (
              <span className="flex-shrink-0 text-xs px-2 py-1 rounded-full bg-blue-500/15 text-blue-200 border border-blue-500/20">
                Selected
              </span>
            )}
          </div>

          {showFull && (
            <div className="mt-4 rounded-2xl bg-slate-900/40 border border-slate-700/60 p-4">
              <p className="text-base text-slate-200 leading-relaxed whitespace-pre-wrap">
                {drill?.drill || ""}
              </p>
            </div>
          )}
        </div>
      </div>
    </Wrapper>
  );
}
