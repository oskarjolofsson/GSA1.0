import { failureReason } from "@/lib/api/failure-reason";
import type { MutationResult } from "@/lib/api/result";

/**
 * Why a user delete failed, in words the admin can act on.
 *
 * The 409 detail matters most: the backend refuses to remove a profile while the
 * Supabase auth user is still there, because an auth row without a profile is
 * invisible in this panel yet still signs in. Passing that sentence through is how
 * the admin learns the account is intact rather than half-deleted.
 */
export function deleteUserFailureReason(
  result: MutationResult,
): string | undefined {
  if (result.status === "notFound") {
    return "That user is already gone.";
  }
  return failureReason(result, {
    denied: "You aren't authorized to delete users.",
    fallback: "Couldn't delete this user. The API may be unreachable — try again.",
  });
}
