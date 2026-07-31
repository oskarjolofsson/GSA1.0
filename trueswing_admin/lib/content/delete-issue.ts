import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toMutationResult, type MutationResult } from "@/lib/api/result";

/**
 * Delete a catalog issue.
 *
 * Contract: DELETE /api/v1/admin/content/issues/{issue_id}/?confirm_impact
 *   → 204 deleted
 *     409 referenced by user data and confirmImpact was not set
 *     403 not admin | 404 unknown issue
 *
 * The 409 is the guard: without `confirmImpact` an issue with programs or practice
 * history behind it will not be removed, so a misclick cannot cascade away a
 * golfer's record. Fetch the impact first and show the counts before setting it.
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
