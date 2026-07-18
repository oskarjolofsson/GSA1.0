import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Defensive: middleware should have redirected, but never trust a null token.
  if (!session) redirect("/login");

  const status = await verifyAdmin(session.access_token);

  console.log("Admin verification status:", status);
  if (status === "admin") redirect("/technical/users");

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-zinc-950">
      {status === "denied" ? <NoAccess /> : <VerifyError />}
    </div>
  );
}
