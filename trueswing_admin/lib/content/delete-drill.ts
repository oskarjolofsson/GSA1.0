import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toMutationResult, type MutationResult } from "@/lib/api/result";

/**
 * Delete a catalog drill.
 *
 * Contract: DELETE /api/v1/admin/content/drills/{drill_id}/?confirm_impact
 *   → 204 deleted
 *     409 either it needs confirmation, or it can never be deleted because it has
 *         recorded practice runs (practice_drill_runs is ON DELETE NO ACTION)
 *     403 not admin | 404 unknown drill
 *
 * Those two 409s mean different things and the backend `detail` distinguishes them.
 * Setting confirmImpact will not get past the practice-history one — detach the
 * drill from its issues instead so it stops being prescribed.
 */
export async function deleteDrill(
  drillId: string,
  token: string,
  { confirmImpact = false }: { confirmImpact?: boolean } = {},
): Promise<MutationResult> {
  const res = await authedFetch(routes.contentDrill(drillId, { confirmImpact }), token, {
    method: "DELETE",
  });
  return toMutationResult(res);
}
