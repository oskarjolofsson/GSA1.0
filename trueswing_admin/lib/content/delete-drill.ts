import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toMutationResult, type MutationResult } from "@/lib/api/result";

/**
 * Delete a catalog drill.
 *
 * Two different 409s, told apart by the backend's `detail`: one wants confirmImpact,
 * the other is a drill with recorded practice runs, which can never be deleted
 * (practice_drill_runs is ON DELETE NO ACTION). confirmImpact will not get past the
 * second — detach the drill from its issues instead.
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
