"use client";

/**
 * Checkbox group over a vocabulary supplied by the server.
 *
 * `values` always comes from GET /api/v1/taxonomy/, never a local constant — ADR-0008.
 */
export default function TagPicker({
  legend,
  values,
  selected,
  onToggle,
  label,
  disabled,
  error,
}: {
  legend: string;
  values: string[];
  selected: string[];
  onToggle: (value: string) => void;
  label: (value: string) => string;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <fieldset disabled={disabled}>
      <legend className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {legend}
      </legend>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {values.map((value) => {
          const on = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(value)}
              className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                on
                  ? "bg-zinc-900 text-white ring-zinc-900 dark:bg-white dark:text-zinc-900 dark:ring-white"
                  : "bg-white text-zinc-600 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-zinc-800"
              }`}
            >
              {label(value)}
            </button>
          );
        })}
      </div>
      {/* Rendered here rather than as a toast: a 422 names the offending tag, and
          that message is only useful next to the picker it came from. */}
      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </fieldset>
  );
}
