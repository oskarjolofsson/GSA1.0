import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toMutationResult, type MutationResult } from "@/lib/api/result";
import type { UpdateIssueBody } from "./types";

/**
 * Edit a catalog issue.
 *
 * Three-state fields: omit to leave it, "" to clear it, text to set it. Tags work the
 * same — omit to keep, [] to remove them all. The server validates before applying
 * anything, so a 422 changes nothing and its `detail` names the rejected value.
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
