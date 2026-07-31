"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import Pagination from "@/features/content/components/pagination";
import TagChip from "@/features/content/components/tag-chip";
import IssueDetail from "@/features/content/components/issue-detail";
import IssueForm from "@/features/content/components/issue-form";
import { areaLabel, goalLabel, kindLabel, missLabel } from "@/features/content/constants";
import type { PageInfo } from "@/features/shared/paginate";
import type {
  AdminDrill,
  AdminIssue,
  AdminIssuePage,
  ComposeIssueBody,
  DeleteImpact,
  Taxonomy,
  UpdateIssueBody,
} from "@/lib/content/types";

type ActionResult = { ok: boolean; reason?: string };

type Props = {
  page: AdminIssuePage;
  pageInfo: PageInfo;
  taxonomy: Taxonomy | null;
  searchAction: (q: string) => Promise<{ ok: boolean; matches: AdminIssue[] }>;
  searchDrillsAction: (q: string) => Promise<{ ok: boolean; matches: AdminDrill[] }>;
  composeAction: (body: ComposeIssueBody) => Promise<ActionResult>;
  updateAction: (
    id: string,
    body: UpdateIssueBody,
  ) => Promise<ActionResult & { issue?: AdminIssue }>;
  source: string;
  deleteAction: (id: string, confirmImpact: boolean) => Promise<ActionResult>;
  impactAction: (id: string) => Promise<DeleteImpact | null>;
  attachAction: (issueId: string, drillId: string) => Promise<ActionResult>;
  detachAction: (issueId: string, drillId: string) => Promise<ActionResult>;
};

/**
 * Content → Issues.
 *
 *   query empty ─▶ server-paged browse list (Prev/Next change ?page)
 *   query typed ─▶ debounced server search across ALL issues, not just this page
 *   row clicked ─▶ <IssueDetail/>
 *   New issue   ─▶ <IssueForm/>
 *
 * Deleted rows are hidden optimistically via `removed`; the action also
 * revalidates so a later navigation reflects the truth.
 */
export default function IssuesExplorer({
  page,
  pageInfo,
  taxonomy,
  source,
  searchAction,
  searchDrillsAction,
  composeAction,
  updateAction,
  deleteAction,
  impactAction,
  attachAction,
  detachAction,
}: Props) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<AdminIssue[]>([]);
  const [searchError, setSearchError] = useState(false);
  const [isSearching, startSearch] = useTransition();
  const [selected, setSelected] = useState<AdminIssue | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
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

  if (editing && selected && taxonomy) {
    return (
      <IssueForm
        taxonomy={taxonomy}
        issue={selected}
        updateAction={updateAction}
        composeAction={composeAction}
        searchDrillsAction={searchDrillsAction}
        onCancel={() => setEditing(false)}
        onSaved={(updated) => {
          // Land back on the detail showing what was just saved, not the snapshot
          // the list loaded.
          if (updated) setSelected(updated);
          setEditing(false);
        }}
      />
    );
  }

  if (creating && taxonomy) {
    return (
      <IssueForm
        taxonomy={taxonomy}
        composeAction={composeAction}
        searchDrillsAction={searchDrillsAction}
        onCancel={() => setCreating(false)}
        onSaved={() => setCreating(false)}
      />
    );
  }

  if (selected) {
    return (
      <IssueDetail
        issue={selected}
        onBack={() => setSelected(null)}
        onEdit={() => setEditing(true)}
        onDeleted={(id) => {
          setRemoved((prev) => new Set(prev).add(id));
          setSelected(null);
        }}
        deleteAction={deleteAction}
        impactAction={impactAction}
        attachAction={attachAction}
        detachAction={detachAction}
        searchDrillsAction={searchDrillsAction}
      />
    );
  }

  const browseRows = page.items.filter((i) => !removed.has(i.id));
  const searchRows =
    trimmed === "" ? [] : matches.filter((i) => !removed.has(i.id));
  const showSearchError = trimmed !== "" && searchError;

  return (
    <div className="flex min-h-[60vh] flex-col">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Issues
        </h2>
        <span className="text-sm text-zinc-400">
          {page.total} issue{page.total === 1 ? "" : "s"}
        </span>
      </div>

      <SourceTabs active={source} />

      <div className="mt-3 flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search issues by title or description…"
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
        />
        <button
          type="button"
          onClick={() => setCreating(true)}
          disabled={!taxonomy}
          title={
            taxonomy
              ? undefined
              : "The tag vocabulary couldn't be loaded, so new issues can't be tagged correctly."
          }
          className="shrink-0 cursor-pointer rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          New issue
        </button>
      </div>

      <div className="mt-4 flex-1">
        {trimmed === "" ? (
          browseRows.length === 0 ? (
            <p className="px-1 py-8 text-center text-sm text-zinc-400">
              No issues on this page.
            </p>
          ) : (
            <>
              <IssueList issues={browseRows} onSelect={setSelected} />
              <Pagination pageInfo={pageInfo} basePath="/content/issues" />
            </>
          )
        ) : showSearchError ? (
          <p className="px-1 py-8 text-center text-sm text-red-600 dark:text-red-400">
            Search failed. The API may be unreachable — try again.
          </p>
        ) : isSearching && searchRows.length === 0 ? (
          <p className="px-1 py-8 text-center text-sm text-zinc-400">Searching…</p>
        ) : searchRows.length === 0 ? (
          <p className="px-1 py-8 text-center text-sm text-zinc-400">
            No issues match “{trimmed}”.
          </p>
        ) : (
          <IssueList issues={searchRows} onSelect={setSelected} />
        )}
      </div>
    </div>
  );
}

const SOURCE_TABS = [
  { value: "catalog", label: "Catalog" },
  { value: "custom", label: "User-authored" },
  { value: "", label: "All" },
] as const;

/**
 * Which slice of the catalog is on screen.
 *
 * Links rather than local state so each tab is a fresh server fetch with its own
 * total and its own pagination, the same way `?page=` works. Defaults to Catalog:
 * mixing golfer-authored issues into the list you curate is what made the
 * distinction invisible.
 */
function SourceTabs({ active }: { active: string }) {
  return (
    <div className="mt-4 inline-flex rounded-full border border-black/[.08] bg-zinc-100 p-1 dark:border-white/[.1] dark:bg-zinc-900">
      {SOURCE_TABS.map((tab) => {
        const on = tab.value === active;
        return (
          <Link
            key={tab.label}
            href={
              tab.value
                ? `/content/issues?source=${tab.value}`
                : "/content/issues?source=all"
            }
            className={`cursor-pointer rounded-full px-4 py-1 text-sm font-medium transition-colors ${
              on
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

function IssueList({
  issues,
  onSelect,
}: {
  issues: AdminIssue[];
  onSelect: (issue: AdminIssue) => void;
}) {
  return (
    <ul className="divide-y divide-black/[.06] overflow-hidden rounded-2xl border border-zinc-200 dark:divide-white/[.08] dark:border-zinc-700">
      {issues.map((issue) => (
        <li key={issue.id}>
          <button
            type="button"
            onClick={() => onSelect(issue)}
            className="flex w-full cursor-pointer flex-col items-start gap-1.5 px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
          >
            <span className="flex w-full items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {issue.title}
              </span>
              <span
                className={`shrink-0 text-xs ${
                  issue.drill_count === 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-zinc-400"
                }`}
              >
                {issue.drill_count === 0
                  ? "no drills"
                  : `${issue.drill_count} drill${issue.drill_count === 1 ? "" : "s"}`}
              </span>
            </span>
            <span className="flex flex-wrap gap-1">
              <TagChip>{areaLabel(issue.area)}</TagChip>
              <TagChip>{kindLabel(issue.kind)}</TagChip>
              {issue.source === "custom" && <TagChip>user-authored</TagChip>}
              {issue.misses.map((m) => (
                <TagChip key={m} tone="miss">
                  {missLabel(m)}
                </TagChip>
              ))}
              {issue.goals.map((g) => (
                <TagChip key={g} tone="goal">
                  {goalLabel(g)}
                </TagChip>
              ))}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
