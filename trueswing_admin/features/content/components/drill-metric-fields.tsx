"use client";

import {
  METRIC_TYPES,
  isCountedType,
  thresholdHint,
  type MetricDraft,
} from "@/features/content/drill-metric-payload";
import type { Taxonomy } from "@/lib/content/types";

const field =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

const labelCls = "text-xs font-semibold uppercase tracking-wide text-zinc-400";

/**
 * Area and metric, shared by the create form and the detail editor.
 *
 * The metric inputs appear only once a type is chosen. Before Slice B every drill was
 * feel-only, and most still are — mirror work has no number to record — so the default
 * state is the quiet one and scoring is opt-in.
 */
export default function DrillMetricFields({
  taxonomy,
  area,
  onAreaChange,
  metric,
  onMetricChange,
  disabled,
}: {
  taxonomy: Taxonomy | null;
  area: string;
  onAreaChange: (area: string) => void;
  metric: MetricDraft;
  onMetricChange: (metric: MetricDraft) => void;
  disabled: boolean;
}) {
  const set = <K extends keyof MetricDraft>(key: K, value: MetricDraft[K]) =>
    onMetricChange({ ...metric, [key]: value });

  const counted = isCountedType(metric.type);
  const hint = thresholdHint(metric);

  return (
    <>
      <label className="block">
        <span className={labelCls}>Area</span>
        <select
          value={area}
          onChange={(e) => onAreaChange(e.target.value)}
          disabled={disabled || !taxonomy}
          className={`mt-1 ${field}`}
        >
          {/* A drill with no area suits every area — mirror work and tempo drills belong
              everywhere. This is not the same as full swing, and defaulting it there
              would hide them from the short-game library. */}
          <option value="">Any area</option>
          {(taxonomy?.areas ?? []).map((a) => (
            <option key={a.key} value={a.key}>
              {a.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={labelCls}>Scoring</span>
        <select
          value={metric.type}
          onChange={(e) => set("type", e.target.value)}
          disabled={disabled}
          className={`mt-1 ${field}`}
        >
          {METRIC_TYPES.map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {metric.type !== "" && (
        <div className="space-y-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelCls}>Reps</span>
              <input
                value={metric.reps}
                onChange={(e) => set("reps", e.target.value)}
                disabled={disabled}
                inputMode="numeric"
                className={`mt-1 ${field}`}
              />
            </label>
            {counted ? (
              <label className="block">
                <span className={labelCls}>Prompt</span>
                <input
                  value={metric.label}
                  onChange={(e) => set("label", e.target.value)}
                  disabled={disabled}
                  placeholder="How many did you make"
                  className={`mt-1 ${field}`}
                />
              </label>
            ) : (
              <label className="block">
                <span className={labelCls}>Unit</span>
                <input
                  value={metric.unit}
                  onChange={(e) => set("unit", e.target.value)}
                  disabled={disabled}
                  placeholder="ft"
                  className={`mt-1 ${field}`}
                />
              </label>
            )}
          </div>

          {!counted && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={labelCls}>Prompt</span>
                <input
                  value={metric.label}
                  onChange={(e) => set("label", e.target.value)}
                  disabled={disabled}
                  placeholder="Average distance to the hole"
                  className={`mt-1 ${field}`}
                />
              </label>
              <label className="block">
                <span className={labelCls}>Ceiling</span>
                <input
                  value={metric.ceiling}
                  onChange={(e) => set("ceiling", e.target.value)}
                  disabled={disabled}
                  inputMode="decimal"
                  className={`mt-1 ${field}`}
                />
              </label>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelCls}>Dialed at</span>
              <input
                value={metric.dialed}
                onChange={(e) => set("dialed", e.target.value)}
                disabled={disabled}
                inputMode="decimal"
                className={`mt-1 ${field}`}
              />
            </label>
            <label className="block">
              <span className={labelCls}>OK at</span>
              <input
                value={metric.ok}
                onChange={(e) => set("ok", e.target.value)}
                disabled={disabled}
                inputMode="decimal"
                className={`mt-1 ${field}`}
              />
            </label>
          </div>

          {/* Thresholds are proportions, which reads like a score out of ten and is not
              one. Spelling them out in the drill's own units is the difference between
              authoring 0.8 confidently and guessing. */}
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {hint ??
              "Thresholds are proportions of a perfect score, so they scale to any rep count."}
          </p>
        </div>
      )}
    </>
  );
}
