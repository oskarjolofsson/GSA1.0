import TaxonomyEditor from "@/features/content/components/taxonomy-editor";
import {
  createTaxonomyTermAction,
  deleteTaxonomyTermAction,
  updateTaxonomyTermAction,
} from "@/features/content/actions";
import { FetchResultView } from "@/components/fetch-result";
import { requireSessionToken } from "@/lib/auth/require-session";
import { listTaxonomyTerms } from "@/lib/content/taxonomy-terms";
import type { AdminTaxonomyTerm, TaxonomyKind } from "@/lib/content/types";

/**
 * Content → Taxonomy (server component): the vocabulary issues are tagged with — areas,
 * goals, and misses scoped to one area. See ADR-0008.
 *
 * All three kinds are fetched together rather than per tab: a few dozen rows in total,
 * switching tabs should not hit the network, and the miss editor needs the area list
 * anyway to offer a parent.
 */
export default async function TaxonomyPage() {
  const token = await requireSessionToken();

  const [areasResult, goalsResult, missesResult] = await Promise.all([
    listTaxonomyTerms("areas", token),
    listTaxonomyTerms("goals", token),
    listTaxonomyTerms("misses", token),
  ]);

  return (
    <FetchResultView
      result={areasResult}
      title="Taxonomy"
      deniedBody="Your account isn't an admin, so you can't edit the vocabulary."
      errorBody="Couldn't load the taxonomy. The API may be unreachable — try again."
    >
      {(areas) => {
        const terms: Record<TaxonomyKind, AdminTaxonomyTerm[]> = {
          areas,
          goals: goalsResult.status === "ok" ? goalsResult.data : [],
          misses: missesResult.status === "ok" ? missesResult.data : [],
        };
        return (
          <TaxonomyEditor
            terms={terms}
            areas={areas.map((a) => a.key)}
            createAction={createTaxonomyTermAction}
            updateAction={updateTaxonomyTermAction}
            deleteAction={deleteTaxonomyTermAction}
          />
        );
      }}
    </FetchResultView>
  );
}
