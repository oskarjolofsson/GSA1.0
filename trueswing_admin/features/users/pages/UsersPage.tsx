import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth/verify-admin";
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
 *   session ─▶ verifyAdmin ─┬ admin  ─▶ getAllUsers ─┬ User[] ─▶ <UsersExplorer/>
 *                           │                         └ null   ─▶ error notice
 *                           ├ denied ─▶ "No access" notice
 *                           └ error  ─▶ error notice
 *
 * Re-verifies admin even though middleware gates the session — the (dashboard)
 * layout does not yet check admin, so this is the defensive boundary for the
 * user list. See the delete Server Action for the matching mutation-side gate.
 */
export default async function UsersPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const status = await verifyAdmin(session.access_token);
  if (status === "denied") {
    return (
      <Notice
        title="Users"
        body="Your account isn't an admin, so you can't view users."
      />
    );
  }
  if (status === "error") {
    return (
      <Notice
        title="Users"
        body="Couldn't verify admin access. Check the API and try again."
      />
    );
  }

  const users = await getAllUsers(session.access_token);
  if (!users) {
    return (
      <Notice
        title="Users"
        body="Couldn't load users. The API may be unreachable — try again."
      />
    );
  }

  return <UsersExplorer users={users} deleteAction={deleteUserAction} />;
}
