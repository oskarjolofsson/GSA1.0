import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toResult, type FetchResult } from "@/lib/api/result";
import type { DeleteImpact } from "./types";

/**
 * Fetch what deleting an issue would destroy. Read-only.
 *
 * Contract: GET /api/v1/admin/content/issues/{issue_id}/impact/
 *   → 200 DeleteImpactResponse | 403 not admin | 404 unknown issue
 *
 * Analyses, programs and practice sessions all CASCADE from an issue, so these
 * counts are real user data. `blocking` true means the delete needs confirmation.
 */
export async function getIssueDeleteImpact(
  issueId: string,
  token: string,
): Promise<FetchResult<DeleteImpact>> {
  const res = await authedFetch(routes.contentIssueImpact(issueId), token);
  return toResult(res, async (r) => (await r.json()) as DeleteImpact);
}

/**
 * Fetch what deleting a drill would touch.
 *
 * Contract: GET /api/v1/admin/content/drills/{drill_id}/impact/
 *   → 200 DeleteImpactResponse | 403 not admin | 404 unknown drill
 *
 * `drill_runs` above zero means the delete is impossible, not merely destructive:
 * practice_drill_runs.drill_id is ON DELETE NO ACTION, so the database refuses it
 * regardless of confirmation.
 */
export async function getDrillDeleteImpact(
  drillId: string,
  token: string,
): Promise<FetchResult<DeleteImpact>> {
  const res = await authedFetch(routes.contentDrillImpact(drillId), token);
  return toResult(res, async (r) => (await r.json()) as DeleteImpact);
}
