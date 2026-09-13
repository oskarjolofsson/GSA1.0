import { useEffect, useState } from 'react';

import issueService from 'features/issues/services/issueService';
import drillService from 'features/drill/services/drillService';
import type { Drill } from 'features/drill/types';
import { fetchTaxonomy, readCachedTaxonomy, type Taxonomy } from 'features/library/services/taxonomyService';
import { getErrorMessage } from 'lib/errors';

export interface IssueDetails {
  title: string;
  description: string | null;
  area: string;
  /** Golfer-facing miss labels ("Slicing it", "Chunking it"), not raw taxonomy keys. */
  missLabels: string[];
  drills: Drill[];
}

function labelForMiss(taxonomy: Taxonomy | null, area: string, missKey: string): string {
  const match = taxonomy?.misses_by_area?.[area]?.find((miss) => miss.key === missKey);
  return match?.golfer_label ?? missKey;
}

interface UseAnalysisIssueDetailsReturn {
  detailsByIssueId: Record<string, IssueDetails>;
  loading: boolean;
  /** Set when the join fetch itself failed outright (not a per-issue drills miss). */
  error: string | null;
}

/**
 * Fills in what `AnalysisIssue` doesn't carry (title/description/drills) for one
 * analysis's issues, once per analysis — not per card. Same fetch pattern
 * useAnalysisData.ts already uses (getIssuesByAnalysis for title/description),
 * plus one getDrillsByIssue per distinct issue since there's no by-analysis
 * drills-grouped-by-issue endpoint. A single issue's drills failing doesn't blank
 * the others; the whole fetch failing just leaves the map empty so callers fall
 * back to their placeholder.
 */
export default function useAnalysisIssueDetails(analysisId: string | null): UseAnalysisIssueDetailsReturn {
  const [detailsByIssueId, setDetailsByIssueId] = useState<Record<string, IssueDetails>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!analysisId) {
      setDetailsByIssueId({});
      setLoading(false);
      setError(null);
      return;
    }

    let isActive = true;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const [issues, taxonomy] = await Promise.all([
          issueService.getIssuesByAnalysis(analysisId),
          // Cache first, best-effort refresh: a stale/missing taxonomy just
          // means miss tags fall back to their raw key, never a broken screen.
          fetchTaxonomy().catch(() => readCachedTaxonomy()),
        ]);
        if (!isActive) return;

        const drillsByIssueId = await Promise.all(
          issues.map(async (issue) => {
            try {
              return [issue.id, await drillService.getDrillsByIssue(issue.id)] as const;
            } catch {
              return [issue.id, [] as Drill[]] as const;
            }
          })
        );
        if (!isActive) return;

        const drillsMap = Object.fromEntries(drillsByIssueId);
        const next: Record<string, IssueDetails> = {};
        for (const issue of issues) {
          next[issue.id] = {
            title: issue.title,
            description: issue.description,
            area: issue.area,
            missLabels: (issue.misses ?? []).map((miss) => labelForMiss(taxonomy, issue.area, miss)),
            drills: drillsMap[issue.id] ?? [],
          };
        }
        setDetailsByIssueId(next);
      } catch (err) {
        if (!isActive) return;
        console.error('useAnalysisIssueDetails: failed to join issue details for analysis', analysisId, err);
        setDetailsByIssueId({});
        setError(getErrorMessage(err));
      } finally {
        if (isActive) setLoading(false);
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [analysisId]);

  return { detailsByIssueId, loading, error };
}
