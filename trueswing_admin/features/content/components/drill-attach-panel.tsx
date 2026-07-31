"use client";

import { useEffect, useState, useTransition } from "react";
import type { AdminDrill } from "@/lib/content/types";

/**
 * Search existing drills and pick one to prescribe.
 *
 * Debounced at 250ms to match the other search boxes. Drills already attached are
 * shown greyed rather than hidden, so it is obvious the drill exists and is already
 * in use rather than looking like the search missed it.
 */
export default function DrillAttachPanel({
  attachedIds,
  onPick,
  searchDrillsAction,
  disabled,
}: {
  attachedIds: string[];
  onPick: (drill: AdminDrill) => void;
  searchDrillsAction: (q: string) => Promise<{ ok: boolean; matches: AdminDrill[] }>;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<AdminDrill[]>([]);
  const [failed, setFailed] = useState(false);
  const [isSearching, startSearch] = useTransition();

  const trimmed = query.trim();
  const shownMatches = trimmed === "" ? [] : matches;
  const shownFailed = trimmed !== "" && failed;

  // Empty query is derived above rather than written back into state, which would
  // be a synchronous setState inside the effect.
  useEffect(() => {
    if (trimmed === "") return;
    const handle = setTimeout(() => {
      startSearch(async () => {
        const res = await searchDrillsAction(trimmed);
        setFailed(!res.ok);
        setMatches(res.ok ? res.matches : []);
      });
    }, 250);
    return () => clearTimeout(handle);
  }, [trimmed, searchDrillsAction]);

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={disabled}
        placeholder="Search existing drills to attach…"
        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
      {trimmed !== "" && (
        <div className="mt-2">
          {shownFailed ? (
            <p className="text-xs text-red-600 dark:text-red-400">
              Drill search failed — try again.
            </p>
          ) : isSearching && shownMatches.length === 0 ? (
            <p className="text-xs text-zinc-400">Searching…</p>
          ) : shownMatches.length === 0 ? (
            <p className="text-xs text-zinc-400">No drills match “{trimmed}”.</p>
          ) : (
            <ul className="divide-y divide-black/[.06] overflow-hidden rounded-lg border border-zinc-200 dark:divide-white/[.08] dark:border-zinc-700">
              {shownMatches.map((drill) => {
                const already = attachedIds.includes(drill.id);
                return (
                  <li key={drill.id}>
                    <button
                      type="button"
                      disabled={already || disabled}
                      onClick={() => {
                        onPick(drill);
                        setQuery("");
                      }}
                      className="flex w-full cursor-pointer flex-col items-start px-3 py-2 text-left transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-zinc-800/60"
                    >
                      <span className="text-sm text-zinc-900 dark:text-zinc-100">
                        {drill.title}
                        {already && (
                          <span className="ml-2 text-xs text-zinc-400">
                            already attached
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {drill.task}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
