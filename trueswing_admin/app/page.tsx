import { redirect } from "next/navigation";
import { requireSessionToken } from "@/lib/auth/require-session";
import { verifyAdmin } from "@/lib/auth/verify-admin";
import NoAccess from "@/features/auth/components/no-access";
import VerifyError from "@/features/auth/components/verify-error";

/**
 * Admin gate. Middleware guarantees a session by the time we get here.
 *
 *   session token ─▶ verifyAdmin ─┬ "admin"  ─▶ redirect to dashboard
 *                                 ├ "denied" ─▶ <NoAccess/>
 *                                 └ "error"  ─▶ <VerifyError/>
 */
export default async function Home() {
  const token = await requireSessionToken();

  const status = await verifyAdmin(token);

  console.log("Admin verification status:", status);
  if (status === "admin") redirect("/technical/users");

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-zinc-950">
      {status === "denied" ? <NoAccess /> : <VerifyError />}
    </div>
  );
}
