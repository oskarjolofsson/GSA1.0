/**
 * Ask the trueswing API whether the current user is an admin.
 *
 * Three-state on purpose: never collapse an error into a deny (that hides outages) or
 * into an allow (that is a security hole).
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
