"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth/verify-admin";
import { deleteUserRequest } from "@/lib/users/delete-user";

/**
 * Delete a user. Invoked from the client via an event handler.
 *
 * Unlike the other admin mutations, the backend DELETE /users/{id}/ endpoint is
 * NOT `require_admin` — it uses get_current_user and only lets you delete your
 * own account. So verifyAdmin here is the ONLY admin gate; do not remove it.
 * (See the flagged bug: this endpoint can't actually delete another user, so the
 * admin "delete" button is effectively broken server-side.)
 * On success, revalidate the users route so a fresh list is fetched next render.
 */
export async function deleteUserAction(
  userId: string,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return { ok: false };
  if ((await verifyAdmin(session.access_token)) !== "admin") {
    return { ok: false };
  }

  const ok = await deleteUserRequest(userId, session.access_token);
  if (ok) revalidatePath("/technical/users");
  return { ok };
}
