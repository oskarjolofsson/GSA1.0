"use client";

import { useState, useTransition } from "react";
import type { User } from "@/lib/users/types";

type Props = {
  user: User;
  onBack: () => void;
  onDeleted: (id: string) => void;
  deleteAction: (id: string) => Promise<{ ok: boolean }>;
};

/** Format a field value for the key-value card. */
function display(value: User[keyof User]): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

const ROWS: { label: string; key: keyof User }[] = [
  { label: "Name", key: "name" },
  { label: "Email", key: "email" },
  { label: "Role", key: "role" },
  { label: "Auth provider", key: "authProvider" },
  { label: "Active", key: "active" },
  { label: "Analyses", key: "analysesCount" },
  { label: "Drills completed", key: "drillsCompleted" },
  { label: "Created", key: "created_at" },
  { label: "Updated", key: "updated_at" },
  { label: "ID", key: "id" },
];

export default function UserDetail({
  user,
  onBack,
  onDeleted,
  deleteAction,
}: Props) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(false);
    startTransition(async () => {
      const { ok } = await deleteAction(user.id);
      if (ok) onDeleted(user.id);
      else {
        setError(true);
        setConfirming(false);
      }
    });
  }

  return (
    <div className="flex min-h-[60vh] flex-col">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 w-fit cursor-pointer text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        ← Back to users
      </button>

      <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        {user.name || user.email}
      </h2>

      <dl className="mt-4 divide-y divide-black/[.06] rounded-2xl border border-zinc-200 dark:divide-white/[.08] dark:border-zinc-700">
        {ROWS.map(({ label, key }) => (
          <div
            key={key}
            className="flex gap-4 px-4 py-3 text-sm sm:grid sm:grid-cols-[10rem_1fr]"
          >
            <dt className="font-medium text-zinc-500 dark:text-zinc-400">
              {label}
            </dt>
            <dd className="min-w-0 break-words text-zinc-900 dark:text-zinc-100">
              {display(user[key])}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-6">
        {error && (
          <p className="mb-2 text-sm text-red-600 dark:text-red-400">
            Couldn&apos;t delete this user. Please try again.
          </p>
        )}
        {confirming ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-600 dark:text-zinc-300">
              Delete {user.name || user.email}? This can&apos;t be undone.
            </span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="cursor-pointer rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              {isPending ? "Deleting…" : "Confirm delete"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={isPending}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="cursor-pointer rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            Delete user
          </button>
        )}
      </div>
    </div>
  );
}
