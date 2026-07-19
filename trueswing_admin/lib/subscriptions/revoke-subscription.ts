import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toMutationResult, type MutationResult } from "@/lib/api/result";

/**
 * Revoke (soft-end) a manual subscription (admin endpoint).
 *
 * Contract: DELETE {NEXT_PUBLIC_API_URL}/api/v1/admin/subscriptions/{id}/
 *   Authorization: Bearer <supabase access token>
 *   → 204 on success, 409 if not a manual sub, 404 if missing
 *
 * Returns a `MutationResult` so the caller can tell "not a manual sub"
 * (conflict) and "missing" (notFound) apart from a generic failure.
 */
export async function revokeSubscription(
  subscriptionId: string,
  token: string,
): Promise<MutationResult> {
  const res = await authedFetch(
    routes.adminSubscription(subscriptionId),
    token,
    { method: "DELETE" },
  );
  return toMutationResult(res);
}
