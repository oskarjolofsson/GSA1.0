"use client";

import { useMemo, useState } from "react";
import type { User } from "@/lib/users/types";
import { filterUsers } from "../filter-users";
import UserDetail from "./user-detail";

type Props = {
  users: User[];
  deleteAction: (id: string) => Promise<{ ok: boolean }>;
};

export default function UsersExplorer({ users, deleteAction }: Props) {
  const [list, setList] = useState(users);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = selectedId
    ? list.find((u) => u.id === selectedId) ?? null
    : null;

  const results = useMemo(() => filterUsers(list, query), [list, query]);

  if (selected) {
    return (
      <UserDetail
        user={selected}
        onBack={() => setSelectedId(null)}
        onDeleted={(id) => {
          setList((prev) => prev.filter((u) => u.id !== id));
          setSelectedId(null);
        }}
        deleteAction={deleteAction}
      />
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col">
      <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        Users
      </h2>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search users by name or email…"
        autoFocus
        className="mt-4 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
      />

      <div className="mt-4 flex-1">
        {query.trim() === "" ? (
          <p className="px-1 py-8 text-center text-sm text-zinc-400">
            Start typing to search {list.length} user
            {list.length === 1 ? "" : "s"}.
          </p>
        ) : results.length === 0 ? (
          <p className="px-1 py-8 text-center text-sm text-zinc-400">
            No users match “{query.trim()}”.
          </p>
        ) : (
          <ul className="divide-y divide-black/[.06] overflow-hidden rounded-2xl border border-zinc-200 dark:divide-white/[.08] dark:border-zinc-700">
            {results.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(user.id)}
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
        )}
      </div>
    </div>
  );
}
