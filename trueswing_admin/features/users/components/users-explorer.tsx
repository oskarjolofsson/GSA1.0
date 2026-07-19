"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import type { User, UserPage } from "@/lib/users/types";
import type { PageInfo } from "@/features/shared/paginate";
import UserDetail from "./user-detail";

type Props = {
  page: UserPage;
  pageInfo: PageInfo;
  deleteAction: (id: string) => Promise<{ ok: boolean }>;
  searchAction: (
    query: string,
  ) => Promise<{ ok: boolean; matches: User[] }>;
};

/**
 * Technical → Users screen.
 *
 *   query empty ─▶ server-paged browse list (Prev/Next change ?page)
 *   query typed ─▶ debounced server search (spans ALL users, not just the page)
 *   row clicked ─▶ <UserDetail/> (view + delete)
 *
 * Delete removes the row optimistically (via `removed`); the page also
 * revalidates server-side so a later navigation reflects the truth.
 */
export default function UsersExplorer({
  page,
  pageInfo,
  deleteAction,
  searchAction,
}: Props) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<User[]>([]);
  const [searchError, setSearchError] = useState(false);
  const [isSearching, startSearch] = useTransition();
  const [selected, setSelected] = useState<User | null>(null);
  const [removed, setRemoved] = useState<Set<string>>(new Set());

  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed === "") {
      setMatches([]);
      setSearchError(false);
      return;
    }
    const handle = setTimeout(() => {
      startSearch(async () => {
        const res = await searchAction(trimmed);
        setSearchError(!res.ok);
        setMatches(res.ok ? res.matches : []);
      });
    }, 250);
    return () => clearTimeout(handle);
  }, [trimmed, searchAction]);

  if (selected) {
    return (
      <UserDetail
        user={selected}
        onBack={() => setSelected(null)}
        onDeleted={(id) => {
          setRemoved((prev) => new Set(prev).add(id));
          setSelected(null);
        }}
        deleteAction={deleteAction}
      />
    );
  }

  const browseRows = page.items.filter((u) => !removed.has(u.id));
  const searchRows = matches.filter((u) => !removed.has(u.id));

  return (
    <div className="flex min-h-[60vh] flex-col">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Users
        </h2>
        <span className="text-sm text-zinc-400">
          {page.total} user{page.total === 1 ? "" : "s"}
        </span>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search users by name or email…"
        autoFocus
        className="mt-4 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
      />

      <div className="mt-4 flex-1">
        {trimmed === "" ? (
          browseRows.length === 0 ? (
            <p className="px-1 py-8 text-center text-sm text-zinc-400">
              No users on this page.
            </p>
          ) : (
            <>
              <UserList users={browseRows} onSelect={setSelected} />
              <Pagination pageInfo={pageInfo} />
            </>
          )
        ) : searchError ? (
          <p className="px-1 py-8 text-center text-sm text-red-600 dark:text-red-400">
            Search failed. The API may be unreachable — try again.
          </p>
        ) : isSearching && searchRows.length === 0 ? (
          <p className="px-1 py-8 text-center text-sm text-zinc-400">Searching…</p>
        ) : searchRows.length === 0 ? (
          <p className="px-1 py-8 text-center text-sm text-zinc-400">
            No users match “{trimmed}”.
          </p>
        ) : (
          <UserList users={searchRows} onSelect={setSelected} />
        )}
      </div>
    </div>
  );
}

function UserList({
  users,
  onSelect,
}: {
  users: User[];
  onSelect: (user: User) => void;
}) {
  return (
    <ul className="divide-y divide-black/[.06] overflow-hidden rounded-2xl border border-zinc-200 dark:divide-white/[.08] dark:border-zinc-700">
      {users.map((user) => (
        <li key={user.id}>
          <button
            type="button"
            onClick={() => onSelect(user)}
            className="flex w-full cursor-pointer flex-col items-start gap-0.5 px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
          >
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {user.name || user.email}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {user.email}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Pagination({ pageInfo }: { pageInfo: PageInfo }) {
  const { page, pageCount, hasPrev, hasNext } = pageInfo;

  const linkBase =
    "rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium transition-colors dark:border-zinc-700";
  const enabled =
    "text-zinc-800 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800";
  const disabled = "pointer-events-none opacity-40 text-zinc-400";

  return (
    <div className="mt-4 flex items-center justify-between">
      {hasPrev ? (
        <Link href={`?page=${page - 1}`} className={`${linkBase} ${enabled}`}>
          Previous
        </Link>
      ) : (
        <span className={`${linkBase} ${disabled}`}>Previous</span>
      )}

      <span className="text-sm text-zinc-400">
        Page {page} of {pageCount}
      </span>

      {hasNext ? (
        <Link href={`?page=${page + 1}`} className={`${linkBase} ${enabled}`}>
          Next
        </Link>
      ) : (
        <span className={`${linkBase} ${disabled}`}>Next</span>
      )}
    </div>
  );
}
