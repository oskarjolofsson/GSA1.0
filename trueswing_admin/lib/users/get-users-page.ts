import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toResult, type FetchResult } from "@/lib/api/result";
import type { User } from "./types";

/**
 * Fetch every user (admin endpoint).
 *
 * Contract: GET {NEXT_PUBLIC_API_URL}/api/v1/users/all/
 *   Authorization: Bearer <supabase access token>
 *   → 200 User[] | 403 when not an admin
 *
 * Returns a three-state `FetchResult` so the page can tell "not admin" (403 →
 * denied) apart from "API unreachable" (network / 5xx → error) — the endpoint is
 * itself `require_admin`, so no separate verify call is needed.
 */
export async function getAllUsers(
  token: string,
): Promise<FetchResult<User[]>> {
  const res = await authedFetch(routes.usersAll(), token);
  return toResult(res, async (r) => {
    const data = await r.json();
    return Array.isArray(data) ? (data as User[]) : null;
  });
}
