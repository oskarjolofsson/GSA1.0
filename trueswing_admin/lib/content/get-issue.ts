import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import { toResult, type FetchResult } from "@/lib/api/result";
import type { AdminIssue } from "./types";

/**
 * Fetch one issue with its tags and linked drills.
 *
 * A 404 maps to `error` rather than a state of its own: the only way to get here with
 * a bad id is a stale link, and the page shows the same "couldn't load" copy.
 */
export async function getIssue(
  issueId: string,
  token: string,
): Promise<FetchResult<AdminIssue>> {
  const res = await authedFetch(routes.contentIssue(issueId), token);
  return toResult(res, async (r) => {
    const data = (await r.json()) as AdminIssue;
    return data?.id ? data : null;
  });
}
