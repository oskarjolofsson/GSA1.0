"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { ProfileMatch, SubscriberPage } from "@/lib/subscriptions/types";
import type { PageInfo } from "@/features/subscriptions/paginate";
import { formatPeriodEnd } from "@/features/subscriptions/format";
import GrantPanel from "./grant-panel";

type Props = {
  page: SubscriberPage;
  pageInfo: PageInfo;
  grantAction: (userId: string) => Promise<{ ok: boolean; reason?: string }>;
  revokeAction: (
    subscriptionId: string,
  ) => Promise<{ ok: boolean; reason?: string }>;
  searchAction: (
    query: string,
  ) => Promise<{ ok: boolean; matches: ProfileMatch[] }>;
};

/**
 * Business → Subscriptions screen.
 *
 * Server-paged subscriber table (Prev/Next are links that change ?page) plus a
 * grant panel. Revoke removes the row optimistically; the page also revalidates
 * server-side so a subsequent navigation reflects the truth.
 */
export default function SubscriptionsExplorer({
  page,
  pageInfo,
  grantAction,
  revokeAction,
  searchAction,
}: Props) {
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [, startRevoke] = useTransition();

  const rows = page.items.filter((s) => !removed.has(s.subscription_id));

  function onRevoke(subscriptionId: string) {
    setError(null);
    setRevokingId(subscriptionId);
    startRevoke(async () => {
      const res = await revokeAction(subscriptionId);
      setRevokingId(null);
      if (!res.ok) {
        setError(
          res.reason ??
            "Couldn't revoke the subscription. It may already be ended — refresh and check.",
        );
        return;
      }
      setRemoved((prev) => new Set(prev).add(subscriptionId));
    });
  }

  return (
    <div className="flex min-h-[60vh] flex-col gap-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Subscriptions
        </h2>
        <span className="text-sm text-zinc-400">
          {page.total} subscriber{page.total === 1 ? "" : "s"}
        </span>
      </div>

      <GrantPanel searchAction={searchAction} grantAction={grantAction} />

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {rows.length === 0 ? (
        <p className="px-1 py-8 text-center text-sm text-zinc-400">
          No subscribers on this page.
        </p>
      ) : (
        <ul className="divide-y divide-black/[.06] overflow-hidden rounded-2xl border border-zinc-200 dark:divide-white/[.08] dark:border-zinc-700">
          {rows.map((s) => (
            <li
              key={s.subscription_id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {s.name || s.email}
                </p>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {s.email}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <div className="text-right">
                  <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                    {s.provider} · {s.status}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {formatPeriodEnd(s.current_period_end)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRevoke(s.subscription_id)}
                  disabled={revokingId === s.subscription_id || s.provider !== "manual"}
                  className="cursor-pointer rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  {revokingId === s.subscription_id ? "Revoking…" : "Revoke"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex items-center justify-between pt-2">
        <PageLink
          page={pageInfo.page - 1}
          enabled={pageInfo.hasPrev}
          label="← Prev"
        />
        <span className="text-xs text-zinc-400">
          Page {pageInfo.page} of {pageInfo.pageCount}
        </span>
        <PageLink
          page={pageInfo.page + 1}
          enabled={pageInfo.hasNext}
          label="Next →"
        />
      </div>
    </div>
  );
}

function PageLink({
  page,
  enabled,
  label,
}: {
  page: number;
  enabled: boolean;
  label: string;
}) {
  const cls =
    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors";
  if (!enabled) {
    return (
      <span
        className={`${cls} cursor-not-allowed border-zinc-200 text-zinc-300 dark:border-zinc-800 dark:text-zinc-600`}
        aria-disabled="true"
      >
        {label}
      </span>
    );
  }
  return (
    <Link
      href={`/business/subscriptions?page=${page}`}
      className={`${cls} border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800/60`}
    >
      {label}
    </Link>
  );
}
