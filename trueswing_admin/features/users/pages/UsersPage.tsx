import { requireSessionToken } from "@/lib/auth/require-session";
import { getAllUsers } from "@/lib/users/get-all-users";
import { deleteUserAction } from "@/features/users/actions";
import { FetchResultView } from "@/components/fetch-result";
import UsersExplorer from "@/features/users/components/users-explorer";

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
  const token = await requireSessionToken();
  const result = await getAllUsers(token);

  return (
    <FetchResultView
      result={result}
      title="Users"
      deniedBody="Your account isn't an admin, so you can't view users."
      errorBody="Couldn't load users. The API may be unreachable — try again."
    >
      {(users) => (
        <UsersExplorer users={users} deleteAction={deleteUserAction} />
      )}
    </FetchResultView>
  );
}
