import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toMutationResult, type MutationResult } from "@/lib/api/result";

/**
 * Grant a manual comp subscription to a user (admin endpoint).
 *
 * Contract: POST {NEXT_PUBLIC_API_URL}/api/v1/admin/subscriptions/
 *   Authorization: Bearer <supabase access token>
 *   body { user_id }
 *   → 201 on success, 409 if already subscribed, 404 if no such user
 *
 * Returns a `MutationResult` so the caller can distinguish "already subscribed"
 * (conflict) and "no such user" (notFound) from a generic failure.
 */
export async function grantSubscription(
  userId: string,
  token: string,
): Promise<MutationResult> {
  const res = await authedFetch(routes.adminSubscriptions(), token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });
  return toMutationResult(res);
}
