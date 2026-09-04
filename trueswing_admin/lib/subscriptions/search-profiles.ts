import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import type { ProfileMatch } from "./types";

/**
 * Search profiles by name/email to find who to grant a subscription to.
 *
 * `null` on failure, distinct from `[]` for no matches.
 */
export async function searchProfiles(
  token: string,
  query: string,
  { limit = 10 }: { limit?: number } = {},
): Promise<ProfileMatch[] | null> {
  const res = await authedFetch(
    routes.adminSubscriptionsSearch({ q: query, limit }),
    token,
  );
  if (!res || !res.ok) return null;

  try {
    const data = await res.json();
    return Array.isArray(data) ? (data as ProfileMatch[]) : null;
  } catch {
    return null;
  }
}
