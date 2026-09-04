import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toResult, type FetchResult } from "@/lib/api/result";
import type { SubscriberPage } from "./types";

/** Fetch one page of currently-valid subscribers. Excludes lapsed and cancelled rows. */
export async function getSubscribers(
  token: string,
  { limit, offset }: { limit: number; offset: number },
): Promise<FetchResult<SubscriberPage>> {
  const res = await authedFetch(
    routes.adminSubscriptionsPage({ limit, offset }),
    token,
  );
  return toResult(res, async (r) => {
    const data = (await r.json()) as SubscriberPage;
    return Array.isArray(data?.items) ? data : null;
  });
}
