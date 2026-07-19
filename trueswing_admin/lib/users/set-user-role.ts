import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toMutationResult, type MutationResult } from "@/lib/api/result";

/**
 * Change a user's role (admin endpoint).
 *
 * Contract: PATCH {NEXT_PUBLIC_API_URL}/api/v1/users/{user_id}/role/
 *   Authorization: Bearer <supabase access token>
 *   body { role: "user" | "admin" }
 *   → 200 GetUser | 403 when changing your own role | 422 bad role
 *
 * Returns a `MutationResult` so the caller can tell the self-change 403
 * (denied) apart from an outage (error). The caller reaches this only after the
 * `withAdmin` gate, so a 403 here means "own role", not "not an admin".
 */
export async function setUserRole(
  userId: string,
  role: "user" | "admin",
  token: string,
): Promise<MutationResult> {
  const res = await authedFetch(routes.userRole(userId), token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  return toMutationResult(res);
}
