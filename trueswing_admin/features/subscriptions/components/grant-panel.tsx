"use client";

import { useEffect, useState, useTransition } from "react";
import type { ProfileMatch } from "@/lib/subscriptions/types";

type Props = {
  searchAction: (
    query: string,
  ) => Promise<{ ok: boolean; matches: ProfileMatch[] }>;
  grantAction: (userId: string) => Promise<{ ok: boolean; reason?: string }>;
};

/**
 * Find a customer and grant them a comp subscription.
 *
 * Debounced search hits the backend `/search/` endpoint (server-side match).
 * Each result knows whether it's already subscribed, so Grant is disabled for
 * those. A raced grant (backend 409) surfaces as an inline error.
 */
export default function GrantPanel({ searchAction, grantAction }: Props) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<ProfileMatch[]>([]);
  const [searchError, setSearchError] = useState(false);
  const [grantError, setGrantError] = useState<string | null>(null);
  const [grantingId, setGrantingId] = useState<string | null>(null);
  const [isSearching, startSearch] = useTransition();
  const [, startGrant] = useTransition();

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

  function onGrant(userId: string) {
    setGrantError(null);
    setGrantingId(userId);
    startGrant(async () => {
      const res = await grantAction(userId);
      setGrantingId(null);
      if (!res.ok) {
        setGrantError(
          res.reason ??
            "Couldn't grant the subscription. They may already be subscribed — refresh and check.",
        );
        return;
      }
      // Reflect the new state locally; the page also revalidates server-side.
      setMatches((prev) =>
        prev.map((m) =>
          m.user_id === userId ? { ...m, subscribed: true } : m,
        ),
      );
    });
  }

  return (
    <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-700">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Grant a subscription
      </h3>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search a customer by name or email…"
        className="mt-3 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
      />

      {grantError && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{grantError}</p>
      )}

      <div className="mt-3">
        {trimmed === "" ? (
          <p className="px-1 py-4 text-center text-sm text-zinc-400">
            Type a name or email to find a customer.
          </p>
        ) : searchError ? (
          <p className="px-1 py-4 text-center text-sm text-red-600 dark:text-red-400">
            Search failed. The API may be unreachable — try again.
          </p>
        ) : isSearching && matches.length === 0 ? (
          <p className="px-1 py-4 text-center text-sm text-zinc-400">Searching…</p>
        ) : matches.length === 0 ? (
          <p className="px-1 py-4 text-center text-sm text-zinc-400">
            No customers match “{trimmed}”.
          </p>
        ) : (
          <ul className="divide-y divide-black/[.06] overflow-hidden rounded-xl border border-zinc-200 dark:divide-white/[.08] dark:border-zinc-700">
            {matches.map((m) => (
              <li
                key={m.user_id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {m.name || m.email}
                  </p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {m.email}
                  </p>
                </div>
                {m.subscribed ? (
                  <span className="shrink-0 text-xs font-medium text-zinc-400">
                    Already subscribed
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onGrant(m.user_id)}
                    disabled={grantingId === m.user_id}
                    className="shrink-0 cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    {grantingId === m.user_id ? "Granting…" : "Grant"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
