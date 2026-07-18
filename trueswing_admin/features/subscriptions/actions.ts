"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth/verify-admin";
import { grantSubscription } from "@/lib/subscriptions/grant-subscription";
import { revokeSubscription } from "@/lib/subscriptions/revoke-subscription";
import { searchProfiles } from "@/lib/subscriptions/search-profiles";
import type { ProfileMatch } from "@/lib/subscriptions/types";

const SUBSCRIPTIONS_PATH = "/business/subscriptions";

/**
 * Server Actions are reachable by direct POST, so each re-verifies admin — do
 * not rely on the page having gated the render. Mutations revalidate the
 * subscriptions route so the next server render fetches a fresh page.
 */

async function adminToken(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;
  if ((await verifyAdmin(session.access_token)) !== "admin") return null;
  return session.access_token;
}

export async function grantSubscriptionAction(
  userId: string,
): Promise<{ ok: boolean }> {
  const token = await adminToken();
  if (!token) return { ok: false };

  const ok = await grantSubscription(userId, token);
  if (ok) revalidatePath(SUBSCRIPTIONS_PATH);
  return { ok };
}

export async function revokeSubscriptionAction(
  subscriptionId: string,
): Promise<{ ok: boolean }> {
  const token = await adminToken();
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

  const token = await adminToken();
  if (!token) return { ok: false, matches: [] };

  const matches = await searchProfiles(token, trimmed);
  if (matches === null) return { ok: false, matches: [] };
  return { ok: true, matches };
}
