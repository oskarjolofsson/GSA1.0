"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth/verify-admin";
import { deleteUserRequest } from "@/lib/users/delete-user";

/**
 * Delete a user. Invoked from the client via an event handler.
 *
 * Server Actions are reachable by direct POST, so re-verify admin here — do not
 * rely on the page having gated the render. On success, revalidate the users
 * route so a fresh list is fetched on the next server render.
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
