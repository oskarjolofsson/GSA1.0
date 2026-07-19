import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toResult, type FetchResult } from "@/lib/api/result";
import type { UserPage } from "./types";

/**
 * Fetch one page of users (admin endpoint).
 *
 * Contract: GET {NEXT_PUBLIC_API_URL}/api/v1/users/?limit&offset
 *   Authorization: Bearer <supabase access token>
 *   → 200 UserPage | 403 when not an admin
 *
 * Returns a three-state `FetchResult` so the page distinguishes "not admin"
 * (403 → denied) from "API unreachable" (network / 5xx → error). The endpoint is
 * `require_admin`, so its status already carries the admin verdict.
 */
export async function getUsersPage(
  token: string,
  { limit, offset }: { limit: number; offset: number },
): Promise<FetchResult<UserPage>> {
  const res = await authedFetch(routes.usersPage({ limit, offset }), token);
  return toResult(res, async (r) => {
    const data = (await r.json()) as UserPage;
    return Array.isArray(data?.items) ? data : null;
  });
}
