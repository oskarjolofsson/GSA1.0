import { authedFetch } from "@/lib/api/authed-fetch";

/**
 * Revoke (soft-end) a manual subscription (admin endpoint).
 *
 * Contract: DELETE {NEXT_PUBLIC_API_URL}/api/v1/admin/subscriptions/{id}/
 *   Authorization: Bearer <supabase access token>
 *   → 204 on success, 409 if not a manual sub, 404 if missing
 *
 * Returns `true` only on a 2xx.
 */
export async function revokeSubscription(
  subscriptionId: string,
  token: string,
): Promise<boolean> {
  const res = await authedFetch(
    `/api/v1/admin/subscriptions/${subscriptionId}/`,
    token,
    { method: "DELETE" },
  );
  return Boolean(res && res.ok);
}
