import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toResult, type FetchResult } from "@/lib/api/result";
import type { AdminDrillPage } from "./types";

/**
 * Fetch one page of catalog drills, each with the issues that prescribe it.
 *
 * Contract: GET /api/v1/admin/content/drills/?limit&offset&q
 *   → 200 AdminDrillPageResponse | 403 when not an admin
 */
export async function getDrillsPage(
  token: string,
  params: { limit: number; offset: number; q?: string },
): Promise<FetchResult<AdminDrillPage>> {
  const res = await authedFetch(routes.contentDrillsPage(params), token);
  return toResult(res, async (r) => {
    const data = (await r.json()) as AdminDrillPage;
    return Array.isArray(data?.items) ? data : null;
  });
}
