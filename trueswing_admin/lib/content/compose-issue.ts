import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toMutationResult, type MutationResult } from "@/lib/api/result";
import type { ComposeIssueBody } from "./types";

/**
 * Create a catalog issue together with its tags, new drills and links to existing
 * drills, in one request.
 *
 * Contract: POST /api/v1/admin/content/issues/
 *   body ComposeIssueRequest
 *   → 201 AdminIssueSchema
 *     403 not admin
 *     404 an existing_drill_id does not resolve
 *     422 an unknown area/kind/tag value, with `detail` naming it
 *
 * Everything shares the request transaction, so a 404 or 422 leaves no partial
 * issue behind. The 422 `detail` is worth surfacing verbatim — it says which value
 * was rejected, which is what the tag picker needs to show.
 */
export async function composeIssue(
  body: ComposeIssueBody,
  token: string,
): Promise<MutationResult> {
  const res = await authedFetch(routes.contentIssues(), token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return toMutationResult(res);
}
