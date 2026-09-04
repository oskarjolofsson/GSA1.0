import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toMutationResult, type MutationResult } from "@/lib/api/result";

/**
 * Change a user's role.
 *
 * Callers reach this only past the `withAdmin` gate, so a `denied` means the admin
 * tried to change their OWN role — which the backend refuses — not "not an admin".
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
