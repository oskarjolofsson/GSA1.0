"use client";

import { useState } from "react";
import type { DeleteImpact } from "@/lib/content/types";

const ROWS: { key: keyof DeleteImpact; label: string }[] = [
  { key: "programs", label: "practice programs" },
  { key: "practice_sessions", label: "practice sessions" },
  { key: "analysis_issues", label: "swing analyses" },
  { key: "drill_runs", label: "recorded drill runs" },
  { key: "mappings", label: "drill links" },
];

/**
 * Confirmation gate for a delete that cascades into user data. A `null` impact means it
 * could not be loaded, and the dialog refuses to offer a delete it cannot describe.
 *
 * `drill_runs > 0` is not just destructive but impossible — practice_drill_runs.drill_id
 * is ON DELETE NO ACTION — so that branch offers detaching instead of a confirm button
 * that would promise something that cannot happen.
 */
export default function DeleteImpactDialog({
  name,
  impact,
  loading,
  pending,
  error,
  onCancel,
  onConfirm,
}: {
  name: string;
  impact: DeleteImpact | null;
  loading: boolean;
  pending: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  // No reset effect needed: the caller renders this conditionally, so each open
  // is a fresh mount and `typed` starts empty on its own.
  const [typed, setTyped] = useState("");

  if (loading) {
    return (
      <Shell onCancel={onCancel}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Checking what this would affect…
        </p>
      </Shell>
    );
  }

  if (!impact) {
    return (
      <Shell onCancel={onCancel}>
        <p className="text-sm text-red-600 dark:text-red-400">
          Couldn&apos;t check what deleting this would affect, so it isn&apos;t safe
          to go ahead. Try again.
        </p>
      </Shell>
    );
  }

  const undeletable = impact.drill_runs > 0;
  const affected = ROWS.filter(({ key }) => Number(impact[key]) > 0);
  const confirmed = typed.trim() === name.trim();

  return (
    <Shell onCancel={onCancel}>
      {undeletable ? (
        <>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            This drill has{" "}
            <strong className="font-semibold">
              {impact.drill_runs} recorded practice run
              {impact.drill_runs === 1 ? "" : "s"}
            </strong>{" "}
            and can&apos;t be deleted — that history is kept deliberately.
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Detach it from its issues instead. It stops being prescribed to golfers
            while the record of who practised it survives.
          </p>
        </>
      ) : affected.length === 0 ? (
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Nothing references <strong className="font-semibold">{name}</strong>.
          Deleting it is safe.
        </p>
      ) : (
        <>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Deleting <strong className="font-semibold">{name}</strong> also removes:
          </p>
          <ul className="mt-2 space-y-1">
            {affected.map(({ key, label }) => (
              <li key={key} className="text-sm text-zinc-700 dark:text-zinc-300">
                <strong className="font-semibold">{String(impact[key])}</strong> {label}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            This is real golfer data and can&apos;t be undone.
          </p>
          <label className="mt-3 block text-xs text-zinc-500 dark:text-zinc-400">
            Type the name to confirm
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={name}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </label>
        </>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
        {!undeletable && (
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending || (affected.length > 0 && !confirmed)}
            className="cursor-pointer rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? "Deleting…" : "Delete"}
          </button>
        )}
      </div>
    </Shell>
  );
}

function Shell({
  children,
  onCancel,
}: {
  children: React.ReactNode;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        {children}
      </div>
    </div>
  );
}
