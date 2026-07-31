import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toResult, type FetchResult } from "@/lib/api/result";
import type { Taxonomy } from "./types";

/**
 * Fetch the allowed tag vocabularies.
 *
 * Contract: GET /api/v1/taxonomy/
 *   → 200 TaxonomyResponse
 *
 * Tag pickers render from this rather than from hardcoded arrays. The write paths
 * validate strictly and return 422 on an unknown value, so a drifted local copy
 * would mean the admin ticks a tag and the save fails — or worse, on the lenient
 * paths, silently drops it.
 */
export async function getTaxonomy(token: string): Promise<FetchResult<Taxonomy>> {
  const res = await authedFetch(routes.taxonomy(), token);
  return toResult(res, async (r) => {
    const data = (await r.json()) as Taxonomy;
    return Array.isArray(data?.misses) && Array.isArray(data?.goals) ? data : null;
  });
}
