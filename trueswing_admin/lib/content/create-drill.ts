import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toMutationResult, type MutationResult } from "@/lib/api/result";
import type { CreateDrillBody } from "./types";

/**
 * Create a global catalog drill, unattached until linked to an issue.
 *
 * Contract: POST /api/v1/admin/content/drills/
 *   body { title, task, success_signal, fault_indicator, area?, metric? }
 *   → 201 AdminDrillSchema | 403 not admin | 422 missing field
 */
export async function createDrill(
  body: CreateDrillBody,
  token: string,
): Promise<MutationResult> {
  const res = await authedFetch(routes.contentDrills(), token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return toMutationResult(res);
}
