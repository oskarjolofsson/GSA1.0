"use client";

import { useMemo, useState, useTransition } from "react";

import {
  draftFromTerm,
  emptyTermDraft,
  normalizeKey,
  termWarning,
  toCreateBody,
  toUpdateBody,
  validateTermDraft,
  type TermDraft,
} from "@/features/content/taxonomy-payload";
import type { AdminTaxonomyTerm, TaxonomyKind } from "@/lib/content/types";

type ActionResult = { ok: boolean; reason?: string };

const field =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500";
const labelCls = "text-xs font-semibold uppercase tracking-wide text-zinc-400";

const TABS: { value: TaxonomyKind; label: string }[] = [
  { value: "areas", label: "Areas" },
  { value: "goals", label: "Goals" },
  { value: "misses", label: "Misses" },
];

const SINGULAR: Record<TaxonomyKind, string> = {
  areas: "area",
  goals: "goal",
  misses: "miss",
};

/**
 * Edit the vocabulary issues are tagged with. See ADR-0008.
 *
 * Three places the data model has teeth: `key` is shown but never editable (content
 * references it, so a rename would orphan every tag); a term in use cannot be deleted
 * (ON DELETE RESTRICT), so delete is disabled with its count and `active: false` is
 * offered instead; and a miss must name an area — a putt is not sliced.
 */
export default function TaxonomyEditor({
  terms,
  areas,
  createAction,
  updateAction,
  deleteAction,
}: {
  terms: Record<TaxonomyKind, AdminTaxonomyTerm[]>;
  /** Area keys, for the miss form's parent select. */
  areas: string[];
  createAction: (kind: TaxonomyKind, body: Record<string, unknown>) => Promise<ActionResult>;
  updateAction: (
    kind: TaxonomyKind,
    key: string,
    body: Record<string, unknown>,
  ) => Promise<ActionResult>;
  deleteAction: (kind: TaxonomyKind, key: string) => Promise<ActionResult>;
}) {
  const [kind, setKind] = useState<TaxonomyKind>("misses");
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const rows = terms[kind] ?? [];

  // Misses group under their area: a flat list of forty is unreadable, and the grouping
  // is also the thing being edited.
  const grouped = useMemo(() => {
    if (kind !== "misses") return null;
    const out = new Map<string, AdminTaxonomyTerm[]>(areas.map((a) => [a, []]));
    for (const t of rows) {
      if (!t.area) continue;
      out.set(t.area, [...(out.get(t.area) ?? []), t]);
    }
    return out;
  }, [kind, rows, areas]);

  function run(fn: () => Promise<ActionResult>, onDone: () => void) {
    setError(undefined);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) onDone();
      else setError(res.reason);
    });
  }

  return (
    <div className="space-y-6">
      <nav className="flex gap-1" aria-label="Vocabulary">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => {
              setKind(t.value);
              setEditing(null);
              setCreating(false);
              setError(undefined);
            }}
            aria-current={kind === t.value ? "page" : undefined}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm transition-colors ${
              kind === t.value
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {creating ? (
        <TermForm
          kind={kind}
          areas={areas}
          initial={emptyTermDraft(kind === "misses" ? areas[0] ?? "" : "")}
          pending={pending}
          onCancel={() => setCreating(false)}
          onSubmit={(draft) =>
            run(() => createAction(kind, toCreateBody(draft, kind)), () =>
              setCreating(false),
            )
          }
        />
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="cursor-pointer rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm text-zinc-600 transition-colors hover:border-zinc-400 dark:border-zinc-600 dark:text-zinc-400"
        >
          Add a {SINGULAR[kind]}
        </button>
      )}

      {grouped ? (
        <div className="space-y-6">
          {[...grouped.entries()].map(([area, areaRows]) => (
            <section key={area} className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {area}
              </h2>
              {areaRows.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  Nothing here yet. The library will show this area as coming soon.
                </p>
              ) : (
                <TermList
                  rows={areaRows}
                  kind={kind}
                  areas={areas}
                  editing={editing}
                  pending={pending}
                  setEditing={setEditing}
                  onSave={(key, draft) =>
                    run(() => updateAction(kind, key, toUpdateBody(draft, kind)), () =>
                      setEditing(null),
                    )
                  }
                  onDelete={(key) => run(() => deleteAction(kind, key), () => setEditing(null))}
                />
              )}
            </section>
          ))}
        </div>
      ) : (
        <TermList
          rows={rows}
          kind={kind}
          areas={areas}
          editing={editing}
          pending={pending}
          setEditing={setEditing}
          onSave={(key, draft) =>
            run(() => updateAction(kind, key, toUpdateBody(draft, kind)), () =>
              setEditing(null),
            )
          }
          onDelete={(key) => run(() => deleteAction(kind, key), () => setEditing(null))}
        />
      )}
    </div>
  );
}

function TermList({
  rows,
  kind,
  areas,
  editing,
  pending,
  setEditing,
  onSave,
  onDelete,
}: {
  rows: AdminTaxonomyTerm[];
  kind: TaxonomyKind;
  areas: string[];
  editing: string | null;
  pending: boolean;
  setEditing: (key: string | null) => void;
  onSave: (key: string, draft: TermDraft) => void;
  onDelete: (key: string) => void;
}) {
  return (
    <ul className="divide-y divide-black/[.06] overflow-hidden rounded-2xl border border-zinc-200 dark:divide-white/[.08] dark:border-zinc-700">
      {rows.map((term) =>
        editing === term.key ? (
          <li key={term.key} className="p-4">
            <TermForm
              kind={kind}
              areas={areas}
              initial={draftFromTerm(term)}
              pending={pending}
              lockKey
              onCancel={() => setEditing(null)}
              onSubmit={(draft) => onSave(term.key, draft)}
            />
          </li>
        ) : (
          <li
            key={term.key}
            className={`flex items-baseline justify-between gap-4 px-4 py-3 ${
              term.active ? "" : "opacity-50"
            }`}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {term.golfer_label}{" "}
                <span className="font-normal text-zinc-400">({term.label})</span>
                {term.active ? null : (
                  <span className="ml-2 text-xs uppercase tracking-wide text-amber-600">
                    retired
                  </span>
                )}
              </p>
              {term.blurb ? (
                <p className="text-sm text-zinc-500">{term.blurb}</p>
              ) : (
                <p className="text-sm italic text-zinc-400">No subtitle</p>
              )}
              <p className="mt-0.5 font-mono text-xs text-zinc-400">{term.key}</p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs text-zinc-400">
                {term.usage_count} issue{term.usage_count === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                onClick={() => setEditing(term.key)}
                disabled={pending}
                className="cursor-pointer text-sm text-zinc-600 transition-colors hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(term.key)}
                disabled={pending || term.usage_count > 0}
                // Disabled rather than hidden, with the reason in the tooltip: the count
                // beside it already says why, and hiding the control would make the rule
                // invisible. Retiring is the route for a term in use.
                title={
                  term.usage_count > 0
                    ? `${term.usage_count} issue${term.usage_count === 1 ? "" : "s"} still use this. Retire it instead.`
                    : "Delete"
                }
                className="cursor-pointer text-sm text-red-600 transition-colors hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-400"
              >
                Delete
              </button>
            </div>
          </li>
        ),
      )}
    </ul>
  );
}

function TermForm({
  kind,
  areas,
  initial,
  pending,
  lockKey = false,
  onCancel,
  onSubmit,
}: {
  kind: TaxonomyKind;
  areas: string[];
  initial: TermDraft;
  pending: boolean;
  /** True when editing: the key is the foreign key content references. */
  lockKey?: boolean;
  onCancel: () => void;
  onSubmit: (draft: TermDraft) => void;
}) {
  const [draft, setDraft] = useState<TermDraft>(initial);
  const set = <K extends keyof TermDraft>(key: K, value: TermDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const blocker = validateTermDraft(draft, kind);
  const warning = termWarning(draft, kind);
  const normalized = normalizeKey(draft.key);

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-700">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelCls}>Key</span>
          <input
            value={draft.key}
            onChange={(e) => set("key", e.target.value)}
            disabled={pending || lockKey}
            placeholder="LEAVES_SHORT"
            className={`mt-1 font-mono ${field}`}
          />
          {lockKey ? (
            <span className="mt-1 block text-xs text-zinc-400">
              Keys can&apos;t change — issues reference them. Add a new term and retire this
              one instead.
            </span>
          ) : normalized && normalized !== draft.key ? (
            <span className="mt-1 block text-xs text-zinc-400">
              Saved as <span className="font-mono">{normalized}</span>
            </span>
          ) : null}
        </label>

        {kind === "misses" ? (
          <label className="block">
            <span className={labelCls}>Area</span>
            <select
              value={draft.area}
              onChange={(e) => set("area", e.target.value)}
              disabled={pending}
              className={`mt-1 ${field}`}
            >
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelCls}>Label (admin)</span>
          <input
            value={draft.label}
            onChange={(e) => set("label", e.target.value)}
            disabled={pending}
            placeholder="Leaves short"
            className={`mt-1 ${field}`}
          />
        </label>
        <label className="block">
          <span className={labelCls}>Golfer label</span>
          <input
            value={draft.golferLabel}
            onChange={(e) => set("golferLabel", e.target.value)}
            disabled={pending}
            placeholder="I leave them short"
            className={`mt-1 ${field}`}
          />
        </label>
      </div>

      <label className="block">
        <span className={labelCls}>Subtitle</span>
        <input
          value={draft.blurb}
          onChange={(e) => set("blurb", e.target.value)}
          disabled={pending}
          placeholder="Never gets to the hole"
          className={`mt-1 ${field}`}
        />
      </label>

      <label className="block w-32">
        <span className={labelCls}>Sort</span>
        <input
          value={draft.sort}
          onChange={(e) => set("sort", e.target.value)}
          disabled={pending}
          inputMode="numeric"
          className={`mt-1 ${field}`}
        />
      </label>

      {warning ? <p className="text-sm text-amber-700 dark:text-amber-500">{warning}</p> : null}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onSubmit(draft)}
          disabled={pending || Boolean(blocker)}
          className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="cursor-pointer text-sm text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          Cancel
        </button>
        {blocker ? <span className="text-sm text-zinc-500">{blocker}</span> : null}
      </div>
    </div>
  );
}
