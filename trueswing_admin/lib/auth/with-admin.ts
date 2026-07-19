import { getSessionToken } from "@/lib/auth/require-session";
import { verifyAdmin } from "@/lib/auth/verify-admin";

/**
 * Run `fn` only when the caller is a verified admin.
 *
 *   no session token      ─▶ fallback
 *   verifyAdmin !== admin  ─▶ fallback   (denied or error)
 *   admin                  ─▶ fn(token)
 *
 * Used by Server Actions that hit backend endpoints which are NOT themselves
 * `require_admin` — e.g. `deleteUserAction`: the DELETE /users/{id}/ endpoint
 * only lets you delete your own account, so this `verifyAdmin` gate is the ONLY
 * thing stopping a non-admin from calling the action directly. Do not remove it.
 */
export async function withAdmin<T>(
  fn: (token: string) => Promise<T>,
  fallback: T,
): Promise<T> {
  const token = await getSessionToken();
  if (!token) return fallback;
  if ((await verifyAdmin(token)) !== "admin") return fallback;
  return fn(token);
}
