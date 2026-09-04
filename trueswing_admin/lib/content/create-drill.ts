import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toMutationResult, type MutationResult } from "@/lib/api/result";
import type { CreateDrillBody } from "./types";

/** Create a global catalog drill, unattached until linked to an issue. */
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
