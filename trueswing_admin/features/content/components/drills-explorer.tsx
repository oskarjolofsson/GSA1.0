"use client";

import { useEffect, useState, useTransition } from "react";

import DeleteImpactDialog from "@/features/content/components/delete-impact-dialog";
import DrillMetricFields from "@/features/content/components/drill-metric-fields";
import Pagination from "@/features/content/components/pagination";
import {
  emptyMetricDraft,
  metricDraftFrom,
  metricFromDraft,
  validateMetricDraft,
  type MetricDraft,
} from "@/features/content/drill-metric-payload";
import type { PageInfo } from "@/features/shared/paginate";
import type {
  AdminDrill,
  AdminDrillPage,
  CreateDrillBody,
  DeleteImpact,
  Taxonomy,
  UpdateDrillBody,
} from "@/lib/content/types";

type ActionResult = { ok: boolean; reason?: string };

const field =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

const FIELDS = [
  ["title", "Title"],
  ["task", "Task"],
  ["success_signal", "Success signal"],
  ["fault_indicator", "Fault indicator"],
] as const;

/** Content → Drills: browse, search, create, edit in place, delete. */
export default function DrillsExplorer({
  page,
  pageInfo,
  taxonomy,
  searchAction,
  createAction,
  updateAction,
  deleteAction,
  impactAction,
}: {
  page: AdminDrillPage;
  pageInfo: PageInfo;
  /** Null when the taxonomy fetch failed. The area picker degrades to "Any area". */
  taxonomy: Taxonomy | null;
  searchAction: (q: string) => Promise<{ ok: boolean; matches: AdminDrill[] }>;
  createAction: (body: CreateDrillBody) => Promise<ActionResult>;
  updateAction: (id: string, body: UpdateDrillBody) => Promise<ActionResult>;
  deleteAction: (id: string, confirmImpact: boolean) => Promise<ActionResult>;
  impactAction: (id: string) => Promise<DeleteImpact | null>;
}) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<AdminDrill[]>([]);
  const [searchError, setSearchError] = useState(false);
  const [isSearching, startSearch] = useTransition();
  const [selected, setSelected] = useState<AdminDrill | null>(null);
  const [creating, setCreating] = useState(false);
  const [removed, setRemoved] = useState<Set<string>>(new Set());

  const trimmed = query.trim();

  // No synchronous setState here: the empty-query case is derived below rather
  // than written back into state, which would cascade an extra render.
  useEffect(() => {
    if (trimmed === "") return;
    const handle = setTimeout(() => {
      startSearch(async () => {
        const res = await searchAction(trimmed);
        setSearchError(!res.ok);
        setMatches(res.ok ? res.matches : []);
      });
    }, 250);
    return () => clearTimeout(handle);
  }, [trimmed, searchAction]);

  if (creating) {
    return (
      <DrillForm
        taxonomy={taxonomy}
        onCancel={() => setCreating(false)}
        onSave={createAction}
        onSaved={() => setCreating(false)}
      />
    );
  }

  if (selected) {
    return (
      <DrillDetail
        drill={selected}
        taxonomy={taxonomy}
        onBack={() => setSelected(null)}
        onDeleted={(id) => {
          setRemoved((prev) => new Set(prev).add(id));
          setSelected(null);
        }}
        updateAction={updateAction}
        deleteAction={deleteAction}
        impactAction={impactAction}
      />
    );
  }

  const rows = (trimmed === "" ? page.items : matches).filter(
    (d) => !removed.has(d.id),
  );
  const showSearchError = trimmed !== "" && searchError;

  return (
    <div className="flex min-h-[60vh] flex-col">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Drills
        </h2>
        <span className="text-sm text-zinc-400">
          {page.total} drill{page.total === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search drills by title or task…"
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="shrink-0 cursor-pointer rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          New drill
        </button>
      </div>

      <div className="mt-4 flex-1">
        {showSearchError ? (
          <p className="px-1 py-8 text-center text-sm text-red-600 dark:text-red-400">
            Search failed. The API may be unreachable — try again.
          </p>
        ) : trimmed !== "" && isSearching && rows.length === 0 ? (
          <p className="px-1 py-8 text-center text-sm text-zinc-400">Searching…</p>
        ) : rows.length === 0 ? (
          <p className="px-1 py-8 text-center text-sm text-zinc-400">
            {trimmed === "" ? "No drills on this page." : `No drills match “${trimmed}”.`}
          </p>
        ) : (
          <>
            <ul className="divide-y divide-black/[.06] overflow-hidden rounded-2xl border border-zinc-200 dark:divide-white/[.08] dark:border-zinc-700">
              {rows.map((drill) => (
                <li key={drill.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(drill)}
                    className="flex w-full cursor-pointer items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {drill.title}
                      </span>
                      <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {drill.task}
                      </span>
                      {/* Which drills are scored is the thing this screen now exists to
                          answer — without it, finding the four putting drills that carry
                          a metric means opening every row. */}
                      {(drill.area || drill.metric) && (
                        <span className="mt-1 block text-xs text-zinc-400">
                          {[
                            drill.area,
                            (drill.metric as { type?: string } | null)?.type,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      )}
                    </span>
                    <span
                      className={`shrink-0 text-xs ${
                        drill.issue_count === 0
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-zinc-400"
                      }`}
                    >
                      {drill.issue_count === 0
                        ? "unused"
                        : `${drill.issue_count} issue${drill.issue_count === 1 ? "" : "s"}`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {trimmed === "" && (
              <Pagination pageInfo={pageInfo} basePath="/content/drills" />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DrillForm({
  taxonomy,
  onCancel,
  onSave,
  onSaved,
}: {
  taxonomy: Taxonomy | null;
  onCancel: () => void;
  onSave: (body: CreateDrillBody) => Promise<ActionResult>;
  onSaved: () => void;
}) {
  const [values, setValues] = useState({
    title: "",
    task: "",
    success_signal: "",
    fault_indicator: "",
  });
  const [area, setArea] = useState("");
  const [metric, setMetric] = useState<MetricDraft>(emptyMetricDraft);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  // A blank area is legal — it means "any area" — so only the text fields gate the save.
  const metricProblem = validateMetricDraft(metric);
  const incomplete = Object.values(values).some((v) => !v.trim()) || Boolean(metricProblem);

  return (
    <div className="flex min-h-[60vh] flex-col">
      <button
        type="button"
        onClick={onCancel}
        className="cursor-pointer self-start text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
      >
        ← Cancel
      </button>
      <h2 className="mt-3 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        New drill
      </h2>
      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="mt-4 max-w-xl space-y-3">
        {FIELDS.map(([key, label]) => (
          <label key={key} className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              {label}
            </span>
            <input
              value={values[key]}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
              disabled={pending}
              className={`mt-1 ${field}`}
            />
          </label>
        ))}

        <DrillMetricFields
          taxonomy={taxonomy}
          area={area}
          onAreaChange={setArea}
          metric={metric}
          onMetricChange={setMetric}
          disabled={pending}
        />

        {metricProblem && (
          <p className="text-sm text-amber-600 dark:text-amber-400">{metricProblem}</p>
        )}

        <button
          type="button"
          disabled={pending || incomplete}
          onClick={() => {
            setError(undefined);
            startTransition(async () => {
              const res = await onSave({
                ...values,
                area: area || null,
                metric: metricFromDraft(metric),
              });
              if (res.ok) onSaved();
              else setError(res.reason);
            });
          }}
          className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-zinc-900"
        >
          {pending ? "Saving…" : "Save drill"}
        </button>
      </div>
    </div>
  );
}

function DrillDetail({
  drill,
  taxonomy,
  onBack,
  onDeleted,
  updateAction,
  deleteAction,
  impactAction,
}: {
  drill: AdminDrill;
  taxonomy: Taxonomy | null;
  onBack: () => void;
  onDeleted: (id: string) => void;
  updateAction: (id: string, body: UpdateDrillBody) => Promise<ActionResult>;
  deleteAction: (id: string, confirmImpact: boolean) => Promise<ActionResult>;
  impactAction: (id: string) => Promise<DeleteImpact | null>;
}) {
  const [values, setValues] = useState({
    title: drill.title,
    task: drill.task,
    success_signal: drill.success_signal,
    fault_indicator: drill.fault_indicator,
  });
  const [area, setArea] = useState(drill.area ?? "");
  const [metric, setMetric] = useState<MetricDraft>(() => metricDraftFrom(drill.metric));
  const metricProblem = validateMetricDraft(metric);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);

  const [confirming, setConfirming] = useState(false);
  const [impact, setImpact] = useState<DeleteImpact | null>(null);
  const [impactLoading, setImpactLoading] = useState(false);

  return (
    <div className="flex min-h-[60vh] flex-col">
      <button
        type="button"
        onClick={onBack}
        className="cursor-pointer self-start text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
      >
        ← Back to drills
      </button>

      <div className="mt-3 flex items-start justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {drill.title}
        </h2>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(undefined);
            setConfirming(true);
            setImpactLoading(true);
            startTransition(async () => {
              setImpact(await impactAction(drill.id));
              setImpactLoading(false);
            });
          }}
          className="shrink-0 cursor-pointer rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 dark:border-red-500/30 dark:text-red-400"
        >
          Delete
        </button>
      </div>

      {drill.issue_count > 0 && (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Prescribed by: {drill.issues.map((i) => i.title).join(", ")}
        </p>
      )}

      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="mt-4 max-w-xl space-y-3">
        {FIELDS.map(([key, label]) => (
          <label key={key} className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              {label}
            </span>
            <input
              value={values[key]}
              onChange={(e) => {
                setSaved(false);
                setValues((v) => ({ ...v, [key]: e.target.value }));
              }}
              disabled={pending}
              className={`mt-1 ${field}`}
            />
          </label>
        ))}

        <DrillMetricFields
          taxonomy={taxonomy}
          area={area}
          onAreaChange={(next) => {
            setSaved(false);
            setArea(next);
          }}
          metric={metric}
          onMetricChange={(next) => {
            setSaved(false);
            setMetric(next);
          }}
          disabled={pending}
        />

        {metricProblem && (
          <p className="text-sm text-amber-600 dark:text-amber-400">{metricProblem}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={pending || Boolean(metricProblem)}
            onClick={() => {
              setError(undefined);
              startTransition(async () => {
                const res = await updateAction(drill.id, {
                  ...values,
                  // Always sent, never omitted: null is how this form says "no area" and
                  // "feel only", and the API distinguishes that from an absent key.
                  area: area || null,
                  metric: metricFromDraft(metric),
                });
                if (res.ok) setSaved(true);
                else setError(res.reason);
              });
            }}
            className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40 dark:bg-white dark:text-zinc-900"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
          {saved && <span className="text-xs text-zinc-400">Saved.</span>}
        </div>
      </div>

      {confirming && (
        <DeleteImpactDialog
          name={drill.title}
          impact={impact}
          loading={impactLoading}
          pending={pending}
          error={error}
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setError(undefined);
            startTransition(async () => {
              const res = await deleteAction(drill.id, true);
              if (res.ok) {
                setConfirming(false);
                onDeleted(drill.id);
              } else setError(res.reason);
            });
          }}
        />
      )}
    </div>
  );
}
