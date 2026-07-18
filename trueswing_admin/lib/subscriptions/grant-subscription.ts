import { authedFetch } from "@/lib/api/authed-fetch";

/**
 * Grant a manual comp subscription to a user (admin endpoint).
 *
 * Contract: POST {NEXT_PUBLIC_API_URL}/api/v1/admin/subscriptions/
 *   Authorization: Bearer <supabase access token>
 *   body { user_id }
 *   → 201 on success, 409 if already subscribed, 404 if no such user
 *
 * Returns `true` only on a 2xx. Any other status (or network failure) → `false`
 * so the caller surfaces an error instead of a false success.
 */
export async function grantSubscription(
  userId: string,
  token: string,
): Promise<boolean> {
  const res = await authedFetch("/api/v1/admin/subscriptions/", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });
  return Boolean(res && res.ok);
}
