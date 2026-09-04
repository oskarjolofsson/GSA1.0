import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toMutationResult, type MutationResult } from "@/lib/api/result";

/**
 * Delete a user, in Supabase auth and in the profile table both.
 *
 * The backend lets a non-admin delete only their own account, so a `denied` here means
 * the caller was not an admin after all.
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
