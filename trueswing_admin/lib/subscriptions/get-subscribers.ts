import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toResult, type FetchResult } from "@/lib/api/result";
import type { SubscriberPage } from "./types";

/**
 * Fetch one page of currently-valid subscribers (admin endpoint).
 *
 * Contract: GET {NEXT_PUBLIC_API_URL}/api/v1/admin/subscriptions/?limit&offset
 *   Authorization: Bearer <supabase access token>
 *   → 200 SubscriberPage | 403 when not an admin
 *
 * Returns a three-state `FetchResult` so the page distinguishes "not admin"
 * (403 → denied) from "API unreachable" (network / 5xx → error). The endpoint is
 * `require_admin`, so its status already carries the admin verdict.
 */
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
