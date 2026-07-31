import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toMutationResult, type MutationResult } from "@/lib/api/result";

/**
 * Update a drill. Partial: omitted fields are left untouched.
 *
 * Contract: PATCH /api/v1/admin/content/drills/{drill_id}/
 *   → 200 AdminDrillSchema | 403 not admin | 404 unknown drill
 */
export async function updateDrill(
  drillId: string,
  body: {
    title?: string;
    task?: string;
    success_signal?: string;
    fault_indicator?: string;
  },
  token: string,
): Promise<MutationResult> {
  const res = await authedFetch(routes.contentDrill(drillId), token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return toMutationResult(res);
}
