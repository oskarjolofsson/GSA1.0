import { requireSessionToken } from "@/lib/auth/require-session";
import { getSubscribers } from "@/lib/subscriptions/get-subscribers";
import {
  grantSubscriptionAction,
  revokeSubscriptionAction,
  searchProfilesAction,
} from "@/features/subscriptions/actions";
import { FetchResultView } from "@/components/fetch-result";
import SubscriptionsExplorer from "@/features/subscriptions/components/subscriptions-explorer";
import { paginate, parsePage } from "@/features/shared/paginate";

const PAGE_SIZE = 10;

/**
 * Admin subscriptions screen (server component). Pagination is server-side: `?page=N`
 * becomes an offset and Prev/Next are links, so each page is a fresh fetch.
 *
 * Next 16: `searchParams` is a Promise and must be awaited.
 */
export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { page: pageParam } = await searchParams;
  const requestedPage = parsePage(pageParam);

  const token = await requireSessionToken();

  const offset = (requestedPage - 1) * PAGE_SIZE;
  const result = await getSubscribers(token, {
    limit: PAGE_SIZE,
    offset,
  });

  return (
    <FetchResultView
      result={result}
      title="Subscriptions"
      deniedBody="Your account isn't an admin, so you can't view subscriptions."
      errorBody="Couldn't load subscriptions. The API may be unreachable — try again."
    >
      {(page) => (
        <SubscriptionsExplorer
          page={page}
          pageInfo={paginate({
            page: requestedPage,
            total: page.total,
            limit: PAGE_SIZE,
            itemsOnPage: page.items.length,
          })}
          grantAction={grantSubscriptionAction}
          revokeAction={revokeSubscriptionAction}
          searchAction={searchProfilesAction}
        />
      )}
    </FetchResultView>
  );
}
