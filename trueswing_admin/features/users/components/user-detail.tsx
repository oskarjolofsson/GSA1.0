"use client";

import { useState, useTransition } from "react";
import type { User } from "@/lib/users/types";
import { formatDateTime } from "@/features/shared/format-date";

type Props = {
  user: User;
  currentUserId: string | null;
  onBack: () => void;
  onDeleted: (id: string) => void;
  deleteAction: (id: string) => Promise<{ ok: boolean }>;
  roleAction: (
    id: string,
    role: "user" | "admin",
  ) => Promise<{ ok: boolean; reason?: string }>;
};

const DATE_KEYS = new Set<keyof User>(["created_at", "updated_at"]);

/** Format a non-date field value for the key-value card. */
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

/** Colored badge for the boolean `active` field. */
function ActiveBadge({ active }: { active: boolean | null | undefined }) {
  if (active === null || active === undefined) {
    return <span className="text-zinc-400">—</span>;
  }
  const dot = active ? "bg-green-500" : "bg-zinc-400";
  const text = active
    ? "text-green-700 dark:text-green-400"
    : "text-zinc-500 dark:text-zinc-400";
  return (
    <span className={`inline-flex items-center gap-1.5 ${text}`}>
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
      {active ? "Yes" : "No"}
    </span>
  );
}

export default function UserDetail({
  user,
  currentUserId,
  onBack,
  onDeleted,
  deleteAction,
  roleAction,
}: Props) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Role is editable, so track it locally and reflect changes immediately.
  const [role, setRole] = useState<string | null>(user.role ?? null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [isRolePending, startRole] = useTransition();

  const isSelf = currentUserId !== null && user.id === currentUserId;
  const isAdmin = role === "admin";

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

  function handleRoleToggle() {
    setRoleError(null);
    const next: "user" | "admin" = isAdmin ? "user" : "admin";
    startRole(async () => {
      const res = await roleAction(user.id, next);
      if (res.ok) setRole(next);
      else setRoleError(res.reason ?? "Couldn't change the role. Try again.");
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
              {key === "active" ? (
                <ActiveBadge active={user.active} />
              ) : key === "role" ? (
                display(role)
              ) : key === "id" ? (
                <span className="font-mono text-xs">{display(user.id)}</span>
              ) : DATE_KEYS.has(key) ? (
                formatDateTime(user[key] as string | null)
              ) : (
                display(user[key])
              )}
            </dd>
          </div>
        ))}
      </dl>

      {/* Role control */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Role
        </h3>
        {isSelf ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            You can&apos;t change your own role.
          </p>
        ) : (
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleRoleToggle}
              disabled={isRolePending}
              className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              {isRolePending
                ? "Updating…"
                : isAdmin
                  ? "Remove admin"
                  : "Make admin"}
            </button>
            {roleError && (
              <span className="text-sm text-red-600 dark:text-red-400">
                {roleError}
              </span>
            )}
          </div>
        )}
      </div>

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
