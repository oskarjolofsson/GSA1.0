import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Resolve the current Supabase access token.
 *
 * Two shapes for two callers, both wrapping the same `createClient()` +
 * `getSession()` dance that every page and action used to copy:
 *
 *   requireSessionToken()  server components — token or redirect("/login")
 *   getSessionToken()      server actions    — token or null
 *
 * Actions can't `redirect()` cleanly mid-mutation, so they get the nullable
 * variant and short-circuit themselves.
 */
export async function getSessionToken(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}

export async function requireSessionToken(): Promise<string> {
  const token = await getSessionToken();
  // Middleware should have redirected already; never trust a null token.
  if (!token) redirect("/login");
  return token;
}
