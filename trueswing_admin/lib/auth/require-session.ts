import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Resolve the current Supabase access token, or null.
 *
 * The nullable variant, for server actions — they cannot `redirect()` cleanly
 * mid-mutation. Server components use `requireSessionToken` below.
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
