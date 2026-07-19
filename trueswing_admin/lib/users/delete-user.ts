import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toMutationResult, type MutationResult } from "@/lib/api/result";

/**
 * Delete a user (admin endpoint).
 *
 * Contract: DELETE {NEXT_PUBLIC_API_URL}/api/v1/users/{user_id}/
 *   Authorization: Bearer <supabase access token>
 *   → 204 No Content on success
 *
 * Returns a `MutationResult` so the caller can tell the failure modes apart
 * (404 → notFound, network → error) instead of a bare boolean.
 */
export async function deleteUserRequest(
  userId: string,
  token: string,
): Promise<MutationResult> {
  const res = await authedFetch(routes.user(userId), token, {
    method: "DELETE",
  });
  return toMutationResult(res);
}
