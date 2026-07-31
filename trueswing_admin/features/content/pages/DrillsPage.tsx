import { FetchResultView } from "@/components/fetch-result";
import { paginate, parsePage } from "@/features/shared/paginate";
import { requireSessionToken } from "@/lib/auth/require-session";
import { getDrillsPage } from "@/lib/content/get-drills-page";
import {
  createDrillAction,
  deleteDrillAction,
  drillImpactAction,
  searchDrillsAction,
  updateDrillAction,
} from "@/features/content/actions";
import DrillsExplorer from "@/features/content/components/drills-explorer";

const PAGE_SIZE = 20;

/**
 * Content → Drills (server component).
 *
 * Same shape as the issues screen: `require_admin` on the endpoint means its 403
 * already carries the admin verdict, so there is no separate check.
 *
 * Next 16: `searchParams` is a Promise and must be awaited.
 */
export default async function DrillsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { page: pageParam } = await searchParams;
  const requestedPage = parsePage(pageParam);

  const token = await requireSessionToken();
  const offset = (requestedPage - 1) * PAGE_SIZE;
  const result = await getDrillsPage(token, { limit: PAGE_SIZE, offset });

  return (
    <FetchResultView
      result={result}
      title="Drills"
      deniedBody="Your account isn't an admin, so you can't manage content."
      errorBody="Couldn't load drills. The API may be unreachable — try again."
    >
      {(page) => (
        <DrillsExplorer
          page={page}
          pageInfo={paginate({
            page: requestedPage,
            total: page.total,
            limit: PAGE_SIZE,
            itemsOnPage: page.items.length,
          })}
          searchAction={searchDrillsAction}
          createAction={createDrillAction}
          updateAction={updateDrillAction}
          deleteAction={deleteDrillAction}
          impactAction={drillImpactAction}
        />
      )}
    </FetchResultView>
  );
}
