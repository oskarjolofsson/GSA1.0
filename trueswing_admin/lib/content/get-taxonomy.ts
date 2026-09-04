import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toResult, type FetchResult } from "@/lib/api/result";
import type { Taxonomy } from "./types";

/**
 * Fetch the allowed tag vocabularies.
 *
 * Tag pickers render from this, never from a local constant — see ADR-0008.
 */
export async function getTaxonomy(token: string): Promise<FetchResult<Taxonomy>> {
  const res = await authedFetch(routes.taxonomy(), token);
  return toResult(res, async (r) => {
    const data = (await r.json()) as Taxonomy;
    return Array.isArray(data?.misses) && Array.isArray(data?.goals) ? data : null;
  });
}
