"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import DrillAttachPanel from "@/features/content/components/drill-attach-panel";
import GolferPreview from "@/features/content/components/golfer-preview";
import TagPicker from "@/features/content/components/tag-picker";
import {
  areaLabel,
  goalLabel,
  kindLabel,
  missLabel,
} from "@/features/content/constants";
import {
  emptyWizardState,
  isDirty,
  isPartialDrill,
  toComposeBody,
  validateWizard,
  wizardWarning,
  type WizardState,
} from "@/features/content/compose-payload";
import type { AdminDrill, ComposeIssueBody, Taxonomy } from "@/lib/content/types";

type ActionResult = { ok: boolean; reason?: string };

const EMPTY_DRILL = {
  title: "",
  task: "",
  success_signal: "",
  fault_indicator: "",
  ai_filled: [],
};

const field =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500";
const labelCls = "text-xs font-semibold uppercase tracking-wide text-zinc-400";

/**
 * Author a catalog issue: identity, tags, plain-language copy and drills, saved in
 * one request to the composite endpoint.
 *
 * The guards are the point of this component:
 *   double-click     the save button disables while pending — the endpoint has no
 *                    idempotency key, so two clicks would create two issues
 *   navigate away    beforeunload fires while the form differs from its initial state
 *   incomplete drill blocks the save rather than silently dropping the half-typed row
 *   422 on a tag     the backend `detail` names the rejected value and is rendered
 *                    beside the picker it came from, not as a toast
 */
export default function IssueForm({
  taxonomy,
  composeAction,
  searchDrillsAction,
  onCancel,
  onSaved,
  initialArea,
  initialMiss,
  initialGoal,
}: {
  taxonomy: Taxonomy;
  composeAction: (body: ComposeIssueBody) => Promise<ActionResult>;
  searchDrillsAction: (q: string) => Promise<{ ok: boolean; matches: AdminDrill[] }>;
  onCancel: () => void;
  onSaved: () => void;
  initialArea?: string;
  initialMiss?: string;
  initialGoal?: string;
}) {
  // Prefilled when arriving from an empty cell on the coverage grid, so the gap the
  // admin clicked is already selected.
  const initial = useMemo<WizardState>(() => {
    const base = emptyWizardState({
      area: initialArea ?? taxonomy.default_area,
      kind: taxonomy.default_kind,
    });
    return {
      ...base,
      misses: initialMiss ? [initialMiss] : [],
      goals: initialGoal ? [initialGoal] : [],
    };
  }, [taxonomy, initialArea, initialMiss, initialGoal]);

  const [state, setState] = useState<WizardState>(initial);
  const [attached, setAttached] = useState<AdminDrill[]>([]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const savedRef = useRef(false);

  const dirty = isDirty(state, initial) || attached.length > 0;
  const blocker = validateWizard(state);
  const warning = wizardWarning({
    ...state,
    existingDrillIds: attached.map((d) => d.id),
  });

  // Browser-level guard. Cancel/back inside the app is handled by onCancel, which
  // is a deliberate action; this catches closing the tab or a hard reload.
  useEffect(() => {
    if (!dirty || savedRef.current) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const set = <K extends keyof WizardState>(key: K, value: WizardState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));

  const toggle = (key: "misses" | "goals", value: string) =>
    setState((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));

  function save() {
    setError(undefined);
    startTransition(async () => {
      const body = toComposeBody({
        ...state,
        existingDrillIds: attached.map((d) => d.id),
      });
      const res = await composeAction(body);
      if (res.ok) {
        savedRef.current = true;
        onSaved();
      } else {
        setError(res.reason);
      }
    });
  }

  // A 422 from strict tag validation names the value it rejected, so show it with
  // the pickers. Anything else is a general failure and belongs at the top.
  const tagError =
    error && /miss|goal|Unknown/i.test(error) ? error : undefined;
  const generalError = tagError ? undefined : error;

  return (
    <div className="flex min-h-[60vh] flex-col">
      <button
        type="button"
        onClick={onCancel}
        className="cursor-pointer self-start text-sm text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        ← Cancel
      </button>

      <h2 className="mt-3 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        New issue
      </h2>

      {generalError && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {generalError}
        </p>
      )}

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <div className="space-y-3">
            <label className="block">
              <span className={labelCls}>Title</span>
              <input
                value={state.title}
                onChange={(e) => set("title", e.target.value)}
                disabled={pending}
                placeholder="Early extension"
                className={`mt-1 ${field}`}
              />
            </label>
            <label className="block">
              <span className={labelCls}>Description</span>
              <textarea
                value={state.description}
                onChange={(e) => set("description", e.target.value)}
                disabled={pending}
                rows={2}
                className={`mt-1 ${field}`}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={labelCls}>Area</span>
                <select
                  value={state.area}
                  onChange={(e) => set("area", e.target.value)}
                  disabled={pending}
                  className={`mt-1 ${field}`}
                >
                  {taxonomy.areas.map((a) => (
                    <option key={a} value={a}>
                      {areaLabel(a)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={labelCls}>Kind</span>
                <select
                  value={state.kind}
                  onChange={(e) => set("kind", e.target.value)}
                  disabled={pending}
                  className={`mt-1 ${field}`}
                >
                  {taxonomy.kinds.map((k) => (
                    <option key={k} value={k}>
                      {kindLabel(k)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-700">
            <TagPicker
              legend="Misses (what the golfer sees)"
              values={taxonomy.misses}
              selected={state.misses}
              onToggle={(v) => toggle("misses", v)}
              label={missLabel}
              disabled={pending}
              error={tagError}
            />
            <TagPicker
              legend="Goals (why they practise)"
              values={taxonomy.goals}
              selected={state.goals}
              onToggle={(v) => toggle("goals", v)}
              label={goalLabel}
              disabled={pending}
            />
          </div>

          <div className="space-y-3">
            <p className={labelCls}>Plain-language copy</p>
            <input
              value={state.laymanTitle}
              onChange={(e) => set("laymanTitle", e.target.value)}
              disabled={pending}
              placeholder="You come over the top"
              className={field}
            />
            <textarea
              value={state.laymanDesc}
              onChange={(e) => set("laymanDesc", e.target.value)}
              disabled={pending}
              rows={2}
              placeholder="Your shoulders start the downswing, so the club swings across the ball."
              className={field}
            />
          </div>

          <details className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-700">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Coach vocabulary (optional)
            </summary>
            <div className="mt-3 space-y-3">
              {(
                [
                  ["currentMotion", "Current motion"],
                  ["expectedMotion", "Expected motion"],
                  ["swingEffect", "Swing effect"],
                  ["shotOutcome", "Shot outcome"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block">
                  <span className={labelCls}>{label}</span>
                  <input
                    value={state[key]}
                    onChange={(e) => set(key, e.target.value)}
                    disabled={pending}
                    className={`mt-1 ${field}`}
                  />
                </label>
              ))}
            </div>
          </details>

          <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-700">
            <div className="flex items-baseline justify-between">
              <p className={labelCls}>Drills</p>
              <button
                type="button"
                onClick={() =>
                  set("newDrills", [...state.newDrills, { ...EMPTY_DRILL }])
                }
                disabled={pending}
                className="cursor-pointer text-xs text-zinc-600 underline disabled:opacity-40 dark:text-zinc-300"
              >
                Add a new drill
              </button>
            </div>

            {state.newDrills.map((drill, index) => (
              <div
                key={index}
                className={`mt-3 space-y-2 rounded-xl border p-3 ${
                  isPartialDrill(drill)
                    ? "border-amber-300 dark:border-amber-500/40"
                    : "border-zinc-200 dark:border-zinc-700"
                }`}
              >
                {(
                  [
                    ["title", "Title"],
                    ["task", "Task"],
                    ["success_signal", "Success signal"],
                    ["fault_indicator", "Fault indicator"],
                  ] as const
                ).map(([key, placeholder]) => (
                  <input
                    key={key}
                    value={drill[key]}
                    onChange={(e) =>
                      set(
                        "newDrills",
                        state.newDrills.map((d, i) =>
                          i === index ? { ...d, [key]: e.target.value } : d,
                        ),
                      )
                    }
                    disabled={pending}
                    placeholder={placeholder}
                    className={field}
                  />
                ))}
                <button
                  type="button"
                  onClick={() =>
                    set(
                      "newDrills",
                      state.newDrills.filter((_, i) => i !== index),
                    )
                  }
                  disabled={pending}
                  className="cursor-pointer text-xs text-zinc-500 underline hover:text-red-600 disabled:opacity-40 dark:text-zinc-400"
                >
                  Remove
                </button>
              </div>
            ))}

            {attached.length > 0 && (
              <ul className="mt-3 space-y-1">
                {attached.map((drill) => (
                  <li
                    key={drill.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60"
                  >
                    <span className="text-sm text-zinc-800 dark:text-zinc-200">
                      {drill.title}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setAttached((prev) => prev.filter((d) => d.id !== drill.id))
                      }
                      disabled={pending}
                      className="cursor-pointer text-xs text-zinc-500 underline disabled:opacity-40 dark:text-zinc-400"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3">
              <DrillAttachPanel
                attachedIds={attached.map((d) => d.id)}
                onPick={(drill) => setAttached((prev) => [...prev, drill])}
                searchDrillsAction={searchDrillsAction}
                disabled={pending}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <GolferPreview
            title={state.title}
            description={state.description}
            laymanTitle={state.laymanTitle}
            laymanDesc={state.laymanDesc}
            misses={state.misses}
            goals={state.goals}
          />

          {warning && (
            <p className="rounded-xl border border-dashed border-amber-300 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/30 dark:text-amber-400">
              {warning}
            </p>
          )}

          <div className="flex items-center justify-end gap-2">
            {blocker && <span className="text-xs text-zinc-400">{blocker}</span>}
            <button
              type="button"
              onClick={save}
              disabled={pending || Boolean(blocker)}
              className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {pending ? "Saving…" : "Save issue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
