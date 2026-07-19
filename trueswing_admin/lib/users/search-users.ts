import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import type { User } from "./types";

/**
 * Search users by name/email (admin endpoint).
 *
 * Contract: GET {NEXT_PUBLIC_API_URL}/api/v1/users/search/?q&limit
 *   Authorization: Bearer <supabase access token>
 *   → 200 User[]
 *
 * Returns `null` on failure so the caller can distinguish an API error from an
 * empty result set.
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
