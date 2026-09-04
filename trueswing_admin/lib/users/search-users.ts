import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import type { User } from "./types";

/**
 * Search users by name/email. Spans all users, not one page.
 *
 * `null` on failure, distinct from `[]` for no matches.
 */
export async function searchUsers(
  token: string,
  query: string,
  { limit = 20 }: { limit?: number } = {},
): Promise<User[] | null> {
  const res = await authedFetch(routes.usersSearch({ q: query, limit }), token);
  if (!res || !res.ok) return null;

  try {
    const data = await res.json();
    return Array.isArray(data) ? (data as User[]) : null;
  } catch {
    return null;
  }
}
