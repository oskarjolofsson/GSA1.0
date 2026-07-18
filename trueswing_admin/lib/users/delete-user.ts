import { authedFetch } from "@/lib/api/authed-fetch";

/**
 * Delete a user (admin endpoint).
 *
 * Contract: DELETE {NEXT_PUBLIC_API_URL}/api/v1/users/{user_id}/
 *   Authorization: Bearer <supabase access token>
 *   → 204 No Content on success
 *
 * Returns `true` only on a 204. Anything else (non-2xx, network failure,
 * missing base URL) is `false` so the caller surfaces a failed-delete state
 * rather than silently pretending it worked.
 */
export async function deleteUserRequest(
  userId: string,
  token: string,
): Promise<boolean> {
  const res = await authedFetch(`/api/v1/users/${userId}/`, token, {
    method: "DELETE",
  });
  return res?.status === 204;
}
