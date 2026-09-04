import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toResult, type FetchResult } from "@/lib/api/result";
import type { AdminIssuePage } from "./types";

/** Fetch one page of catalog issues. */
export async function getIssuesPage(
  token: string,
  params: {
    limit: number;
    offset: number;
    q?: string;
    area?: string;
    kind?: string;
    source?: string;
  },
): Promise<FetchResult<AdminIssuePage>> {
  const res = await authedFetch(routes.contentIssuesPage(params), token);
  return toResult(res, async (r) => {
    const data = (await r.json()) as AdminIssuePage;
    return Array.isArray(data?.items) ? data : null;
  });
}
