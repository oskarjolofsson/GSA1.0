"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { grantSubscription } from "@/lib/subscriptions/grant-subscription";
import { revokeSubscription } from "@/lib/subscriptions/revoke-subscription";
import { searchProfiles } from "@/lib/subscriptions/search-profiles";
import type { ProfileMatch } from "@/lib/subscriptions/types";

const SUBSCRIPTIONS_PATH = "/business/subscriptions";

/**
 * Server Actions are reachable by direct POST, but every admin endpoint they hit
 * is `require_admin` on the backend — a non-admin token gets a 403 and the lib
 * wrapper returns `ok:false`. So there's no separate verify here; we just need a
 * session token. Mutations revalidate the subscriptions route so the next server
 * render fetches a fresh page.
 */

async function sessionToken(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}

export async function grantSubscriptionAction(
  userId: string,
): Promise<{ ok: boolean }> {
  const token = await sessionToken();
  if (!token) return { ok: false };

  const ok = await grantSubscription(userId, token);
  if (ok) revalidatePath(SUBSCRIPTIONS_PATH);
  return { ok };
}

export async function revokeSubscriptionAction(
  subscriptionId: string,
): Promise<{ ok: boolean }> {
  const token = await sessionToken();
  if (!token) return { ok: false };

  const ok = await revokeSubscription(subscriptionId, token);
  if (ok) revalidatePath(SUBSCRIPTIONS_PATH);
  return { ok };
}

export async function searchProfilesAction(
  query: string,
): Promise<{ ok: boolean; matches: ProfileMatch[] }> {
  const trimmed = query.trim();
  if (!trimmed) return { ok: true, matches: [] };

  const token = await sessionToken();
  if (!token) return { ok: false, matches: [] };

  const matches = await searchProfiles(token, trimmed);
  if (matches === null) return { ok: false, matches: [] };
  return { ok: true, matches };
}
