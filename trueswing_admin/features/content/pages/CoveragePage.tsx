import { FetchResultView } from "@/components/fetch-result";
import { requireSessionToken } from "@/lib/auth/require-session";
import { getCoverage } from "@/lib/content/get-coverage";
import { getTaxonomy } from "@/lib/content/get-taxonomy";
import type { Taxonomy } from "@/lib/content/types";
import CoverageGrid from "@/features/content/components/coverage-grid";

/**
 * Content → Coverage (server component).
 *
 * Answers "what is missing from the catalog?" — which goal/miss combinations a
 * golfer could pick and find nothing to practise, plus the two catalog health
 * counts the backend has always exposed on /admin/stats/ and nothing rendered.
 */
export default async function CoveragePage() {
  const token = await requireSessionToken();
  // Fetched together: coverage supplies the counts, the taxonomy the words. A failed
  // taxonomy fetch degrades the grid to raw keys rather than failing the page.
  const [result, taxonomyResult] = await Promise.all([
    getCoverage(token),
    getTaxonomy(token),
  ]);
  const taxonomy: Taxonomy | null =
    taxonomyResult.status === "ok" ? taxonomyResult.data : null;

  return (
    <FetchResultView
      result={result}
      title="Coverage"
      deniedBody="Your account isn't an admin, so you can't view coverage."
      errorBody="Couldn't load coverage. The API may be unreachable — try again."
    >
      {(coverage) => <CoverageGrid coverage={coverage} taxonomy={taxonomy} />}
    </FetchResultView>
  );
}
