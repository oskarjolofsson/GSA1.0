import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth/verify-admin";
import { getSubscribers } from "@/lib/subscriptions/get-subscribers";
import {
  grantSubscriptionAction,
  revokeSubscriptionAction,
  searchProfilesAction,
} from "@/features/subscriptions/actions";
import SubscriptionsExplorer from "@/features/subscriptions/components/subscriptions-explorer";
import { paginate, parsePage } from "@/features/subscriptions/paginate";

const PAGE_SIZE = 10;

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
 * Admin subscriptions screen (server component).
 *
 *   session ─▶ verifyAdmin ─┬ admin  ─▶ getSubscribers(page) ─┬ Page ─▶ <SubscriptionsExplorer/>
 *                           │                                  └ null ─▶ error notice
 *                           ├ denied ─▶ "No access" notice
 *                           └ error  ─▶ error notice
 *
 * Pagination is server-side: `?page=N` → offset. Prev/Next are links that change
 * the query, so each page is a fresh server fetch. Re-verifies admin here (the
 * dashboard layout does not gate admin); the Server Actions re-verify too.
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

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const status = await verifyAdmin(session.access_token);
  if (status === "denied") {
    return (
      <Notice
        title="Subscriptions"
        body="Your account isn't an admin, so you can't view subscriptions."
      />
    );
  }
  if (status === "error") {
    return (
      <Notice
        title="Subscriptions"
        body="Couldn't verify admin access. Check the API and try again."
      />
    );
  }

  const offset = (requestedPage - 1) * PAGE_SIZE;
  const page = await getSubscribers(session.access_token, {
    limit: PAGE_SIZE,
    offset,
  });
  if (!page) {
    return (
      <Notice
        title="Subscriptions"
        body="Couldn't load subscriptions. The API may be unreachable — try again."
      />
    );
  }

  const info = paginate({
    page: requestedPage,
    total: page.total,
    limit: PAGE_SIZE,
    itemsOnPage: page.items.length,
  });

  return (
    <SubscriptionsExplorer
      page={page}
      pageInfo={info}
      grantAction={grantSubscriptionAction}
      revokeAction={revokeSubscriptionAction}
      searchAction={searchProfilesAction}
    />
  );
}
