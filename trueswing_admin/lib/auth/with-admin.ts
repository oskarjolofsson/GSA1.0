import { getSessionToken } from "@/lib/auth/require-session";
import { verifyAdmin } from "@/lib/auth/verify-admin";

/**
 * Run `fn` only when the caller is a verified admin, else return `fallback`.
 *
 * For the Server Actions whose backend route is only `get_current_user` rather than
 * `require_admin` — the users feature. The backend still refuses cross-user writes, so
 * this is defence in depth and the source of a better message, not the only gate.
 * See ADR-0010.
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
