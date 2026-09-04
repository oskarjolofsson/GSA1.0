import { requireSessionToken } from "@/lib/auth/require-session";
import { createClient } from "@/lib/supabase/server";
import { getUsersPage } from "@/lib/users/get-users-page";
import {
  deleteUserAction,
  searchUsersAction,
  setUserRoleAction,
} from "@/features/users/actions";
import { FetchResultView } from "@/components/fetch-result";
import UsersExplorer from "@/features/users/components/users-explorer";
import { paginate, parsePage } from "@/features/shared/paginate";

const PAGE_SIZE = 10;

/**
 * Admin users screen (server component). Pagination is server-side: `?page=N` becomes an
 * offset and Prev/Next are links, so each page is a fresh fetch.
 *
 * Next 16: `searchParams` is a Promise and must be awaited.
 */
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { page: pageParam } = await searchParams;
  const requestedPage = parsePage(pageParam);

  const token = await requireSessionToken();

  // The current admin's own id, so the detail view can disable the role toggle
  // on their own row (the backend 403 guard is the authoritative check).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  const offset = (requestedPage - 1) * PAGE_SIZE;
  const result = await getUsersPage(token, { limit: PAGE_SIZE, offset });

  return (
    <FetchResultView
      result={result}
      title="Users"
      deniedBody="Your account isn't an admin, so you can't view users."
      errorBody="Couldn't load users. The API may be unreachable — try again."
    >
      {(page) => (
        <UsersExplorer
          page={page}
          pageInfo={paginate({
            page: requestedPage,
            total: page.total,
            limit: PAGE_SIZE,
            itemsOnPage: page.items.length,
          })}
          currentUserId={currentUserId}
          deleteAction={deleteUserAction}
          searchAction={searchUsersAction}
          roleAction={setUserRoleAction}
        />
      )}
    </FetchResultView>
  );
}
