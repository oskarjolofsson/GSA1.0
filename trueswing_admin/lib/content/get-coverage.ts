import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toResult, type FetchResult } from "@/lib/api/result";
import type { Coverage } from "./types";

/**
 * Fetch issue counts across every area/miss/goal combination.
 *
 * Contract: GET /api/v1/admin/content/coverage/
 *   → 200 CoverageResponse | 403 when not an admin
 *
 * Cells are generated from the taxonomy, so combinations with no content come back
 * with issue_count 0 rather than being absent — those zeros are the point.
 */
export async function getCoverage(token: string): Promise<FetchResult<Coverage>> {
  const res = await authedFetch(routes.contentCoverage(), token);
  return toResult(res, async (r) => {
    const data = (await r.json()) as Coverage;
    return Array.isArray(data?.cells) ? data : null;
  });
}
