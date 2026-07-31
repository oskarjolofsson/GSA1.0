import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toMutationResult, type MutationResult } from "@/lib/api/result";
import type { UpdateIssueBody } from "./types";

/**
 * Edit a catalog issue.
 *
 * Contract: PATCH /api/v1/admin/content/issues/{issue_id}/
 *   body UpdateAdminIssueRequest
 *   → 200 AdminIssueSchema
 *     403 not admin | 404 unknown issue
 *     422 an unknown area/kind/tag value, with `detail` naming it
 *
 * Partial and three-state: omit a field to leave it, send "" to clear it, send
 * text to set it. Tags work the same — omit to keep, [] to remove them all. The
 * server validates before applying anything, so a 422 changes nothing.
 */
export async function updateIssue(
  issueId: string,
  body: UpdateIssueBody,
  token: string,
): Promise<MutationResult> {
  const res = await authedFetch(routes.contentIssue(issueId), token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return toMutationResult(res);
}
