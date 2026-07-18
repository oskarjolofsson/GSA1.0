"use client";

import { useRouter } from "next/navigation";
import SignOutButton from "./sign-out-button";

export default function VerifyError() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Couldn&apos;t verify access
      </h1>
      <p className="max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
        We reached your account but couldn&apos;t confirm admin access right now.
        This is usually a temporary problem.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => router.refresh()}
          className="h-10 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Retry
        </button>
        <SignOutButton />
      </div>
    </div>
  );
}
