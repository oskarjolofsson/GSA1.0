import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toMutationResult, type MutationResult } from "@/lib/api/result";
import type { UpdateDrillBody } from "./types";

/**
 * Update a drill. Partial: omitted fields are left untouched.
 *
 * `area` and `metric` are the exception to "omitted": null clears them, so sending null
 * un-scopes or un-scores the drill rather than leaving it alone.
 *
 * Contract: PATCH /api/v1/admin/content/drills/{drill_id}/
 *   → 200 AdminDrillSchema | 403 not admin | 404 unknown drill
 */
export async function updateDrill(
  drillId: string,
  body: UpdateDrillBody,
  token: string,
): Promise<MutationResult> {
  const res = await authedFetch(routes.contentDrill(drillId), token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return toMutationResult(res);
}
