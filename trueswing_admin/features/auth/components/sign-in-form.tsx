"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      setPending(false);
      return;
    }
    router.replace("/");
  }

  async function handleGoogleSignIn() {
    setError(null);
    setPending(true);
    try {
      const supabase = createClient();
      // skipBrowserRedirect: we navigate ourselves so the redirect is
      // deterministic (no reliance on supabase-js touching window.location).
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/`,
          skipBrowserRedirect: true,
          // Always show Google's account chooser instead of silently reusing
          // the last signed-in account.
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("No OAuth URL returned by Supabase.");
      window.location.assign(data.url);
    } catch (e) {
      // Always surface the reason and re-enable the button — never leave it
      // silently disabled with pending stuck true.
      setError(e instanceof Error ? e.message : "Google sign-in failed.");
      setPending(false);
    }
  }

  const field =
    "w-full rounded-lg border border-black/[.1] bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/[.15] dark:bg-zinc-900 dark:text-zinc-100";

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handlePasswordSignIn} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Password
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={field}
          />
        </label>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-1 h-10 rounded-lg bg-zinc-900 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs text-zinc-400">
        <span className="h-px flex-1 bg-black/[.08] dark:bg-white/[.12]" />
        or
        <span className="h-px flex-1 bg-black/[.08] dark:bg-white/[.12]" />
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={pending}
        className="flex h-10 items-center justify-center gap-2 rounded-lg border border-black/[.1] bg-white text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-white/[.15] dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        <GoogleIcon />
        Continue with Google
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}
