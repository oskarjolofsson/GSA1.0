import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toMutationResult, type MutationResult } from "@/lib/api/result";

/**
 * Grant a manual comp subscription to a user.
 *
 * `conflict` means already subscribed, `notFound` no such user — both are ordinary
 * outcomes the grant panel shows inline, not failures.
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
