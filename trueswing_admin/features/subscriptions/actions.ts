"use server";

import { revalidatePath } from "next/cache";
import { getSessionToken } from "@/lib/auth/require-session";
import { grantSubscription } from "@/lib/subscriptions/grant-subscription";
import { revokeSubscription } from "@/lib/subscriptions/revoke-subscription";
import { searchProfiles } from "@/lib/subscriptions/search-profiles";
import type { MutationResult } from "@/lib/api/result";
import type { ProfileMatch } from "@/lib/subscriptions/types";

const SUBSCRIPTIONS_PATH = "/business/subscriptions";

/**
 * Server Actions are reachable by direct POST, but every admin endpoint they hit
 * is `require_admin` on the backend — a non-admin token gets a 403 and the lib
 * wrapper returns `denied`. So there's no separate verify here; we just need a
 * session token. Mutations revalidate the subscriptions route so the next server
 * render fetches a fresh page.
 */

/** Outcome shape the client components consume: ok, plus a message on failure. */
type ActionResult = { ok: boolean; reason?: string };

export async function grantSubscriptionAction(
  userId: string,
): Promise<ActionResult> {
  const token = await getSessionToken();
  if (!token) return { ok: false, reason: "Your session expired — sign in again." };

  const result = await grantSubscription(userId, token);
  if (result.status === "ok") {
    revalidatePath(SUBSCRIPTIONS_PATH);
    return { ok: true };
  }
  return { ok: false, reason: grantFailureReason(result) };
}

export async function revokeSubscriptionAction(
  subscriptionId: string,
): Promise<ActionResult> {
  const token = await getSessionToken();
  if (!token) return { ok: false, reason: "Your session expired — sign in again." };

  const result = await revokeSubscription(subscriptionId, token);
  if (result.status === "ok") {
    revalidatePath(SUBSCRIPTIONS_PATH);
    return { ok: true };
  }
  return { ok: false, reason: revokeFailureReason(result) };
}

/** Map a failed grant to a message the admin can act on. */
function grantFailureReason(result: MutationResult): string {
  switch (result.status) {
    case "conflict":
      return "They're already subscribed.";
    case "notFound":
      return "That user no longer exists.";
    case "denied":
    case "unauthorized":
      return "You don't have permission to do that.";
    default:
      return "Couldn't grant the subscription — the API may be unreachable. Try again.";
  }
}

/** Map a failed revoke to a message the admin can act on. */
function revokeFailureReason(result: MutationResult): string {
  switch (result.status) {
    case "conflict":
      return "That subscription isn't a manual grant, so it can't be revoked here.";
    case "notFound":
      return "That subscription no longer exists.";
    case "denied":
    case "unauthorized":
      return "You don't have permission to do that.";
    default:
      return "Couldn't revoke the subscription — the API may be unreachable. Try again.";
  }
}

export async function searchProfilesAction(
  query: string,
): Promise<{ ok: boolean; matches: ProfileMatch[] }> {
  const trimmed = query.trim();
  if (!trimmed) return { ok: true, matches: [] };

  const token = await getSessionToken();
  if (!token) return { ok: false, matches: [] };

  const matches = await searchProfiles(token, trimmed);
  if (matches === null) return { ok: false, matches: [] };
  return { ok: true, matches };
}
