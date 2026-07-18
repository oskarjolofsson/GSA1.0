import { authedFetch } from "@/lib/api/authed-fetch";
import type { SubscriberPage } from "./types";

/**
 * Fetch one page of active subscribers (admin endpoint).
 *
 * Contract: GET {NEXT_PUBLIC_API_URL}/api/v1/admin/subscriptions/?limit&offset
 *   Authorization: Bearer <supabase access token>
 *   → 200 SubscriberPage
 *
 * Returns `null` on any failure (network, non-2xx, unparseable body, missing
 * base URL) so the caller renders an honest error state rather than an empty
 * table. Never collapse an error into an empty page — that would look like
 * "no subscribers".
 */
export async function getSubscribers(
  token: string,
  { limit, offset }: { limit: number; offset: number },
): Promise<SubscriberPage | null> {
  const res = await authedFetch(
    `/api/v1/admin/subscriptions/?limit=${limit}&offset=${offset}`,
    token,
  );
  if (!res || !res.ok) return null;

  try {
    const data = (await res.json()) as SubscriberPage;
    return Array.isArray(data?.items) ? data : null;
  } catch {
    return null;
  }
}
