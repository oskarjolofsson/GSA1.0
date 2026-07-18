import { authedFetch } from "@/lib/api/authed-fetch";
import type { User } from "./types";

/**
 * Fetch every user (admin endpoint).
 *
 * Contract: GET {NEXT_PUBLIC_API_URL}/api/v1/users/all/
 *   Authorization: Bearer <supabase access token>
 *   → 200 User[]
 *
 * Returns `null` on any failure (network, non-2xx, unparseable body, missing
 * base URL) so the caller renders an honest error state rather than an empty
 * list. Never collapse an error into `[]` — that would look like "no users".
 */
export async function getAllUsers(token: string): Promise<User[] | null> {
  const res = await authedFetch("/api/v1/users/all/", token);
  if (!res || !res.ok) return null;

  try {
    const data = await res.json();
    return Array.isArray(data) ? (data as User[]) : null;
  } catch {
    return null;
  }
}
