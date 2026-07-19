"use server";

import { revalidatePath } from "next/cache";
import { withAdmin } from "@/lib/auth/with-admin";
import { getSessionToken } from "@/lib/auth/require-session";
import { deleteUserRequest } from "@/lib/users/delete-user";
import { searchUsers } from "@/lib/users/search-users";
import { setUserRole } from "@/lib/users/set-user-role";
import type { User } from "@/lib/users/types";

/**
 * Delete a user. Invoked from the client via an event handler.
 *
 * The backend DELETE /users/{id}/ endpoint uses get_current_user (not
 * `require_admin`) and its service checks `is_admin` for the actor, so an admin
 * can delete any user while a non-admin can only delete themselves. The
 * `withAdmin` gate here is still the client-side admin check; do not remove it.
 * On success, revalidate the users route so a fresh list is fetched next render.
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
 * Search users by name/email. Invoked from the client search box (debounced).
 *
 * Leans on the endpoint's own `require_admin` gate, so it only needs a session
 * token (mirrors `searchProfilesAction`). Returns `ok:false` on any failure so
 * the UI can show an error state instead of a silent empty list.
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
 * Change a user's role (admin only). Invoked from the user detail view.
 *
 * Gated by `withAdmin` (the endpoint is `require_admin`), so a 403 from the API
 * here means the admin tried to change their OWN role, not "not an admin". That
 * case surfaces a specific message; everything else is a generic failure.
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
