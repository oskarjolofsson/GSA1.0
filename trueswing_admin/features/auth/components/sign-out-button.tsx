"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton({
  className,
  children = "Sign out",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.replace("/login");
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className={
        className ??
        "h-10 rounded-lg border border-black/[.1] bg-white px-4 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-white/[.15] dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      }
    >
      {children}
    </button>
  );
}
