"use client";

import { useState, useTransition } from "react";

import DeleteImpactDialog from "@/features/content/components/delete-impact-dialog";
import DrillAttachPanel from "@/features/content/components/drill-attach-panel";
import GolferPreview from "@/features/content/components/golfer-preview";
import TagChip from "@/features/content/components/tag-chip";
import { labelsFrom } from "@/features/content/constants";
import type { AdminDrill, AdminIssue, DeleteImpact, Taxonomy } from "@/lib/content/types";

type ActionResult = { ok: boolean; reason?: string };

const ROWS: { label: string; key: keyof AdminIssue }[] = [
  { label: "Description", key: "description" },
  { label: "Current motion", key: "current_motion" },
  { label: "Expected motion", key: "expected_motion" },
  { label: "Swing effect", key: "swing_effect" },
  { label: "Shot outcome", key: "shot_outcome" },
];

const display = (value: unknown) =>
  typeof value === "string" && value.trim() ? value : "—";

export default function IssueDetail({
  issue,
  onBack,
  onDeleted,
  onEdit,
  deleteAction,
  impactAction,
  attachAction,
  detachAction,
  searchDrillsAction,
  taxonomy,
}: {
  issue: AdminIssue;
  onBack: () => void;
  onDeleted: (id: string) => void;
  onEdit: () => void;
  deleteAction: (id: string, confirmImpact: boolean) => Promise<ActionResult>;
  impactAction: (id: string) => Promise<DeleteImpact | null>;
  attachAction: (issueId: string, drillId: string) => Promise<ActionResult>;
  detachAction: (issueId: string, drillId: string) => Promise<ActionResult>;
  searchDrillsAction: (q: string) => Promise<{ ok: boolean; matches: AdminDrill[] }>;
  // Nullable: a failed taxonomy fetch degrades to raw keys rather than blanking the page.
  taxonomy: Taxonomy | null;
}) {
  const labels = labelsFrom(taxonomy);
  // Drills are edited in place, so the local copy is the source of truth for this
  // view; the server actions revalidate the list behind it.
  const [drills, setDrills] = useState(issue.drills);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const [confirming, setConfirming] = useState(false);
  const [impact, setImpact] = useState<DeleteImpact | null>(null);
  const [impactLoading, setImpactLoading] = useState(false);

  function openDeleteDialog() {
    setError(undefined);
    setConfirming(true);
    setImpactLoading(true);
    startTransition(async () => {
      setImpact(await impactAction(issue.id));
      setImpactLoading(false);
    });
  }

  function confirmDelete() {
    setError(undefined);
    startTransition(async () => {
      const res = await deleteAction(issue.id, true);
      if (res.ok) {
        setConfirming(false);
        onDeleted(issue.id);
      } else {
        setError(res.reason);
      }
    });
  }

  function detach(drillId: string) {
    setError(undefined);
    startTransition(async () => {
      const res = await detachAction(issue.id, drillId);
      if (res.ok) setDrills((prev) => prev.filter((d) => d.id !== drillId));
      else setError(res.reason);
    });
  }

  function attach(drill: AdminDrill) {
    setError(undefined);
    startTransition(async () => {
      const res = await attachAction(issue.id, drill.id);
      if (res.ok) {
        setDrills((prev) => [
          ...prev,
          {
            id: drill.id,
            title: drill.title,
            task: drill.task,
            success_signal: drill.success_signal,
            fault_indicator: drill.fault_indicator,
          },
        ]);
      } else {
        setError(res.reason);
      }
    });
  }

  return (
    <div className="flex min-h-[60vh] flex-col">
      <button
        type="button"
        onClick={onBack}
        className="cursor-pointer self-start text-sm text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        ← Back to issues
      </button>

      <div className="mt-3 flex items-start justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {issue.title}
        </h2>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onEdit}
            disabled={pending}
            className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={openDeleteDialog}
            disabled={pending}
            className="cursor-pointer rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            Delete
          </button>
        </div>
      </div>

      {issue.source === "custom" && (
        <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          Written by a golfer, not by you. Editing changes what they see in their own
          library. Owner: <code>{issue.user_id}</code>
        </p>
      )}

      <div className="mt-2 flex flex-wrap gap-1">
        <TagChip>{labels.areaLabel(issue.area)}</TagChip>
        <TagChip>{labels.kindLabel(issue.kind)}</TagChip>
        {issue.source === "custom" && <TagChip>user-authored</TagChip>}
        {issue.misses.map((m) => (
          <TagChip key={m} tone="miss">
            {labels.missLabel(m)}
          </TagChip>
        ))}
        {issue.goals.map((g) => (
          <TagChip key={g} tone="goal">
            {labels.goalLabel(g)}
          </TagChip>
        ))}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <dl className="divide-y divide-black/[.06] overflow-hidden rounded-2xl border border-zinc-200 dark:divide-white/[.08] dark:border-zinc-700">
            {ROWS.map(({ label, key }) => (
              <div key={label} className="px-4 py-3">
                <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
                <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-100">
                  {display(issue[key])}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-5">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Drills
              </h3>
              <span className="text-xs text-zinc-400">
                {drills.length === 0 ? "none attached" : `${drills.length} attached`}
              </span>
            </div>

            {drills.length === 0 ? (
              <p className="mt-2 rounded-xl border border-dashed border-amber-300 px-3 py-3 text-xs text-amber-700 dark:border-amber-500/30 dark:text-amber-400">
                A golfer can start this issue but has nothing to practise.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-black/[.06] overflow-hidden rounded-2xl border border-zinc-200 dark:divide-white/[.08] dark:border-zinc-700">
                {drills.map((drill) => (
                  <li
                    key={drill.id}
                    className="flex items-start justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {drill.title}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {drill.task}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => detach(drill.id)}
                      disabled={pending}
                      className="shrink-0 cursor-pointer text-xs text-zinc-500 underline transition-colors hover:text-red-600 disabled:opacity-40 dark:text-zinc-400 dark:hover:text-red-400"
                    >
                      Detach
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3">
              <DrillAttachPanel
                attachedIds={drills.map((d) => d.id)}
                onPick={attach}
                searchDrillsAction={searchDrillsAction}
                disabled={pending}
              />
            </div>
          </div>
        </div>

        <GolferPreview
          labels={labels}
          title={issue.title}
          description={issue.description ?? ""}
          laymanTitle={issue.layman_title ?? ""}
          laymanDesc={issue.layman_desc ?? ""}
          misses={issue.misses}
          goals={issue.goals}
        />
      </div>

      {confirming && (
        <DeleteImpactDialog
          name={issue.title}
          impact={impact}
          loading={impactLoading}
          pending={pending}
          error={error}
          onCancel={() => setConfirming(false)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
