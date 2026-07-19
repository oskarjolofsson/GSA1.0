/**
 * Ask the trueswing API whether the current user is an admin.
 *
 * Contract: GET {NEXT_PUBLIC_API_URL}/api/v1/admin/verify/
 *   Authorization: Bearer <supabase access token>
 *   → 200 { is_admin: boolean }
 *   → 403 when not verified
 *
 * Three-state result so the caller can tell "not admin" (403 / is_admin=false)
 * apart from "couldn't reach the API" (network / 5xx). Never collapse an error
 * into a deny — that would hide outages, and never into an allow — that would
 * be a security hole.
 */
import { routes } from "@/lib/api/routes";

export type AdminStatus = "admin" | "denied" | "error";

export async function verifyAdmin(accessToken: string): Promise<AdminStatus> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return "error";

  let res: Response;
  try {
    res = await fetch(`${base}${routes.adminVerify()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
  } catch {
    return "error";
  }

  if (res.status === 403) return "denied";
  if (!res.ok) return "error";

  try {
    const data = (await res.json()) as { is_admin?: boolean };
    return data.is_admin === true ? "admin" : "denied";
  } catch {
    return "error";
  }
}
