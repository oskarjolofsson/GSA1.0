import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllUsers } from "@/lib/users/get-all-users";
import { deleteUserAction } from "@/features/users/actions";
import UsersExplorer from "@/features/users/components/users-explorer";

/** Small centered message for the non-happy states. */
function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col">
      <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        {title}
      </h2>
      <div className="mt-4 flex flex-1 items-center justify-center rounded-2xl border border-dashed border-zinc-200 px-6 text-center text-sm text-zinc-400 dark:border-zinc-700">
        {body}
      </div>
    </div>
  );
}

/**
 * Admin users screen (server component).
 *
 *   session ─▶ getAllUsers ─┬ ok     ─▶ <UsersExplorer/>
 *                           ├ denied ─▶ "No access" notice
 *                           └ error  ─▶ error notice
 *
 * No separate admin check: the users endpoint is `require_admin`, so its 403
 * already means "not admin" — one round-trip does both. verifyAdmin runs only at
 * sign-in (app/page.tsx). The delete Server Action leans on the same backend gate.
 */
export default async function UsersPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const result = await getAllUsers(session.access_token);
  if (result.status === "denied") {
    return (
      <Notice
        title="Users"
        body="Your account isn't an admin, so you can't view users."
      />
    );
  }
  if (result.status === "error") {
    return (
      <Notice
        title="Users"
        body="Couldn't load users. The API may be unreachable — try again."
      />
    );
  }

  return <UsersExplorer users={result.data} deleteAction={deleteUserAction} />;
}
