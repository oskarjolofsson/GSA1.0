import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toResult, type FetchResult } from "@/lib/api/result";
import type { AdminDrill } from "./types";

/**
 * Fetch one drill with the issues that prescribe it.
 *
 * Contract: GET /api/v1/admin/content/drills/{drill_id}/
 *   → 200 AdminDrillSchema | 403 not admin | 404 unknown drill
 */
export async function getDrill(
  drillId: string,
  token: string,
): Promise<FetchResult<AdminDrill>> {
  const res = await authedFetch(routes.contentDrill(drillId), token);
  return toResult(res, async (r) => {
    const data = (await r.json()) as AdminDrill;
    return data?.id ? data : null;
  });
}
