"use server";

import { revalidatePath } from "next/cache";
import { withAdmin } from "@/lib/auth/with-admin";
import { getSessionToken } from "@/lib/auth/require-session";
import { deleteUserRequest } from "@/lib/users/delete-user";
import { searchUsers } from "@/lib/users/search-users";
import { setUserRole } from "@/lib/users/set-user-role";
import type { User } from "@/lib/users/types";

/**
 * Delete a user.
 *
 * Gated by `withAdmin` because DELETE /users/{id}/ is only `get_current_user` — it lets
 * a non-admin delete their own account. See ADR-0010.
 */
export async function deleteUserAction(
  userId: string,
): Promise<{ ok: boolean }> {
  return withAdmin(async (token) => {
    const result = await deleteUserRequest(userId, token);
    if (result.status === "ok") revalidatePath("/technical/users");
    return { ok: result.status === "ok" };
  }, { ok: false });
}

/**
 * Search users by name/email.
 *
 * `ok: false` on any failure, so the UI can show an error state rather than an empty
 * list, which would read as "no matches".
 */
export async function searchUsersAction(
  query: string,
): Promise<{ ok: boolean; matches: User[] }> {
  const trimmed = query.trim();
  if (!trimmed) return { ok: true, matches: [] };

  const token = await getSessionToken();
  if (!token) return { ok: false, matches: [] };

  const matches = await searchUsers(token, trimmed);
  if (matches === null) return { ok: false, matches: [] };
  return { ok: true, matches };
}

/**
 * Change a user's role.
 *
 * Past the `withAdmin` gate a `denied` means the admin tried to change their OWN role,
 * which the backend refuses — hence the specific message on that branch.
 */
export async function setUserRoleAction(
  userId: string,
  role: "user" | "admin",
): Promise<{ ok: boolean; reason?: string }> {
  return withAdmin(
    async (token) => {
      const result = await setUserRole(userId, role, token);
      if (result.status === "ok") {
        revalidatePath("/technical/users");
        return { ok: true };
      }
      if (result.status === "denied") {
        return { ok: false, reason: "You can't change your own role." };
      }
      return {
        ok: false,
        reason:
          result.detail ??
          "Couldn't change the role. The API may be unreachable — try again.",
      };
    },
    { ok: false, reason: "You aren't authorized to change roles." },
  );
}
