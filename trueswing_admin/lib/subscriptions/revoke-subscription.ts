import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toMutationResult, type MutationResult } from "@/lib/api/result";

/**
 * Revoke (soft-end) a manual subscription.
 *
 * `conflict` means the subscription is not a manual comp — a Stripe or RevenueCat one
 * has to be cancelled where it was bought.
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
