import type { User } from "@/lib/users/types";

/**
 * Google-style client-side search over the user list.
 *
 * Case-insensitive substring match on name OR email. An empty (or whitespace-
 * only) query returns `[]` — the search view shows a prompt rather than dumping
 * every user. Results are capped at `limit` so a huge list can't tank the DOM.
 */
export function filterUsers(
  users: User[],
  query: string,
  limit = 50,
): User[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const matches: User[] = [];
  for (const user of users) {
    if (
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q)
    ) {
      matches.push(user);
      if (matches.length >= limit) break;
    }
  }
  return matches;
}
