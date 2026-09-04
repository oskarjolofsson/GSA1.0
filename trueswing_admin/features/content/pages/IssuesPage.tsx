import { FetchResultView } from "@/components/fetch-result";
import { paginate, parsePage } from "@/features/shared/paginate";
import { requireSessionToken } from "@/lib/auth/require-session";
import { getIssuesPage } from "@/lib/content/get-issues-page";
import { getTaxonomy } from "@/lib/content/get-taxonomy";
import type { Taxonomy } from "@/lib/content/types";
import {
  attachDrillAction,
  composeIssueAction,
  deleteIssueAction,
  detachDrillAction,
  issueImpactAction,
  searchDrillsAction,
  searchIssuesAction,
  updateIssueAction,
} from "@/features/content/actions";
import IssuesExplorer from "@/features/content/components/issues-explorer";

const PAGE_SIZE = 20;

/**
 * Which slice of the catalog to show. Defaults to `catalog` — the content you
 * curate — so golfer-authored issues don't silently pad the list you browse.
 * `?source=all` is the explicit opt-out and maps to no filter at all.
 */
function parseSource(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "all") return "";
  if (value === "custom") return "custom";
  return "catalog";
}

/**
 * Content → Issues (server component).
 *
 * The taxonomy is fetched here rather than in the client so the tag pickers have their
 * vocabulary before first paint. If it fails the explorer still renders, but cannot
 * offer the wizard — an empty picker would let the admin save tags the backend rejects.
 *
 * Next 16: `searchParams` is a Promise and must be awaited.
 */
export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[]; source?: string | string[] }>;
}) {
  const { page: pageParam, source: sourceParam } = await searchParams;
  const requestedPage = parsePage(pageParam);
  const source = parseSource(sourceParam);

  const token = await requireSessionToken();
  const offset = (requestedPage - 1) * PAGE_SIZE;

  const [result, taxonomyResult] = await Promise.all([
    // An empty source means "all"; the request module omits the param entirely.
    getIssuesPage(token, { limit: PAGE_SIZE, offset, source: source || undefined }),
    getTaxonomy(token),
  ]);
  const taxonomy: Taxonomy | null =
    taxonomyResult.status === "ok" ? taxonomyResult.data : null;

  return (
    <FetchResultView
      result={result}
      title="Issues"
      deniedBody="Your account isn't an admin, so you can't manage content."
      errorBody="Couldn't load issues. The API may be unreachable — try again."
    >
      {(page) => (
        <IssuesExplorer
          page={page}
          pageInfo={paginate({
            page: requestedPage,
            total: page.total,
            limit: PAGE_SIZE,
            itemsOnPage: page.items.length,
          })}
          taxonomy={taxonomy}
          source={source}
          searchAction={searchIssuesAction}
          searchDrillsAction={searchDrillsAction}
          composeAction={composeIssueAction}
          updateAction={updateIssueAction}
          deleteAction={deleteIssueAction}
          impactAction={issueImpactAction}
          attachAction={attachDrillAction}
          detachAction={detachDrillAction}
        />
      )}
    </FetchResultView>
  );
}
