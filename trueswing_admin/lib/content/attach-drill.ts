import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toMutationResult, type MutationResult } from "@/lib/api/result";

/**
 * Prescribe an existing drill for an issue.
 *
 * Contract: POST /api/v1/admin/content/issues/{issue_id}/drills/{drill_id}/
 *   → 200 AdminIssueSchema | 409 already attached | 404 unknown issue or drill
 */
export async function attachDrill(
  issueId: string,
  drillId: string,
  token: string,
): Promise<MutationResult> {
  const res = await authedFetch(routes.contentIssueDrill(issueId, drillId), token, {
    method: "POST",
  });
  return toMutationResult(res);
}

/**
 * Unlink a drill from an issue. The drill and its practice history survive — it may
 * be prescribed by other issues.
 *
 * Contract: DELETE /api/v1/admin/content/issues/{issue_id}/drills/{drill_id}/
 *   → 200 AdminIssueSchema | 404 the link does not exist
 */
export async function detachDrill(
  issueId: string,
  drillId: string,
  token: string,
): Promise<MutationResult> {
  const res = await authedFetch(routes.contentIssueDrill(issueId, drillId), token, {
    method: "DELETE",
  });
  return toMutationResult(res);
}
