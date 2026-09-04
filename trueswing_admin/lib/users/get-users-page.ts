import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toResult, type FetchResult } from "@/lib/api/result";
import type { UserPage } from "./types";

/** Fetch one page of users. */
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
