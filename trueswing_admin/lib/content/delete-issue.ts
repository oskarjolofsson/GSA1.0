import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toMutationResult, type MutationResult } from "@/lib/api/result";

/**
 * Delete a catalog issue.
 *
 * Without `confirmImpact` an issue with programs or practice history behind it 409s,
 * so a misclick cannot cascade away a golfer's record. Fetch the impact and show the
 * counts before setting it.
 */
export async function deleteIssue(
  issueId: string,
  token: string,
  { confirmImpact = false }: { confirmImpact?: boolean } = {},
): Promise<MutationResult> {
  const res = await authedFetch(routes.contentIssue(issueId, { confirmImpact }), token, {
    method: "DELETE",
  });
  return toMutationResult(res);
}
