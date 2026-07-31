"use client";

import Link from "next/link";
import { useState } from "react";

import { areaLabel, goalLabel, missLabel } from "@/features/content/constants";
import type { Coverage } from "@/lib/content/types";

/**
 * Where the catalog has content and where it does not.
 *
 * One grid per area: misses down, goals across. A zero cell means a golfer who
 * picks that goal and reports that miss gets nothing back — those are the gaps
 * worth filling, so they are the ones highlighted rather than the populated cells.
 */
export default function CoverageGrid({ coverage }: { coverage: Coverage }) {
  const areas = [...new Set(coverage.cells.map((c) => c.area))];
  const [area, setArea] = useState(areas[0] ?? "");

  const cells = coverage.cells.filter((c) => c.area === area);
  const misses = [...new Set(cells.map((c) => c.miss).filter(Boolean))] as string[];
  const goals = [...new Set(cells.map((c) => c.goal).filter(Boolean))] as string[];

  const countFor = (miss: string, goal: string) =>
    cells.find((c) => c.miss === miss && c.goal === goal)?.issue_count ?? 0;

  const gapsInArea = cells.filter((c) => c.issue_count === 0).length;

  return (
    <div className="flex min-h-[60vh] flex-col">
      <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        Coverage
      </h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <HealthCard
          count={coverage.issues_with_no_drills}
          label="issues with no drills"
          hint="A golfer can start these but has nothing to practise."
          href="/content/issues"
        />
        <HealthCard
          count={coverage.unmapped_drills}
          label="drills attached to nothing"
          hint="Written but never prescribed, so no golfer will ever see them."
          href="/content/drills"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {areas.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setArea(a)}
            className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${
              a === area
                ? "bg-zinc-900 text-white ring-zinc-900 dark:bg-white dark:text-zinc-900 dark:ring-white"
                : "bg-white text-zinc-600 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700"
            }`}
          >
            {areaLabel(a)}
          </button>
        ))}
        <span className="ml-auto text-xs text-zinc-400">
          {gapsInArea} empty combination{gapsInArea === 1 ? "" : "s"} in{" "}
          {areaLabel(area)}
        </span>
      </div>

      <div className="mt-3 overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-700">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:bg-zinc-900">
                Miss \ Goal
              </th>
              {goals.map((goal) => (
                <th
                  key={goal}
                  className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400"
                >
                  {goalLabel(goal)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {misses.map((miss) => (
              <tr
                key={miss}
                className="border-t border-black/[.06] dark:border-white/[.08]"
              >
                <th className="sticky left-0 bg-white px-3 py-2 text-left text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                  {missLabel(miss)}
                </th>
                {goals.map((goal) => {
                  const count = countFor(miss, goal);
                  return (
                    <td key={goal} className="px-1 py-1">
                      {count === 0 ? (
                        <Link
                          href={`/content/issues?new=1&area=${area}&miss=${miss}&goal=${goal}`}
                          title={`No issues for ${missLabel(miss)} + ${goalLabel(goal)} — create one`}
                          className="flex h-8 w-full items-center justify-center rounded-md border border-dashed border-amber-300 text-xs text-amber-700 transition-colors hover:bg-amber-50 dark:border-amber-500/30 dark:text-amber-400 dark:hover:bg-amber-500/10"
                        >
                          +
                        </Link>
                      ) : (
                        <span className="flex h-8 w-full items-center justify-center rounded-md bg-zinc-50 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {count}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-zinc-400">
        Dashed cells have no issues. Click one to start an issue already tagged for
        that combination.
      </p>
    </div>
  );
}

function HealthCard({
  count,
  label,
  hint,
  href,
}: {
  count: number;
  label: string;
  hint: string;
  href: string;
}) {
  const bad = count > 0;
  return (
    <Link
      href={href}
      className={`rounded-2xl border p-4 transition-colors ${
        bad
          ? "border-amber-300 hover:bg-amber-50 dark:border-amber-500/30 dark:hover:bg-amber-500/10"
          : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/60"
      }`}
    >
      <p
        className={`text-2xl font-semibold ${
          bad ? "text-amber-700 dark:text-amber-400" : "text-zinc-900 dark:text-zinc-100"
        }`}
      >
        {count}
      </p>
      <p className="text-sm text-zinc-700 dark:text-zinc-300">{label}</p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
    </Link>
  );
}
