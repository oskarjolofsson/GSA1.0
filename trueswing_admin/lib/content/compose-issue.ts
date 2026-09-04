import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toMutationResult, type MutationResult } from "@/lib/api/result";
import type { ComposeIssueBody } from "./types";

/**
 * Create a catalog issue together with its tags, new drills and links to existing
 * drills, in one request.
 *
 * Everything shares one transaction, so a failure leaves no partial issue behind. The
 * 422 `detail` names the rejected tag value and is worth surfacing verbatim.
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
