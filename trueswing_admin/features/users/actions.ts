"use server";

import { revalidatePath } from "next/cache";
import { withAdmin } from "@/lib/auth/with-admin";
import { deleteUserRequest } from "@/lib/users/delete-user";

/**
 * Delete a user. Invoked from the client via an event handler.
 *
 * Unlike the other admin mutations, the backend DELETE /users/{id}/ endpoint is
 * NOT `require_admin` — it uses get_current_user and only lets you delete your
 * own account. So the `withAdmin` gate here is the ONLY admin check; do not
 * remove it. (See the flagged bug: this endpoint can't actually delete another
 * user, so the admin "delete" button is effectively broken server-side.)
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
