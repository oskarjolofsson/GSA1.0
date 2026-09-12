import { useEffect, useState } from 'react';

import issueService from 'features/issues/services/issueService';
import drillService from 'features/drill/services/drillService';
import type { Drill } from 'features/drill/types';

export interface IssueDetails {
  title: string;
  description: string | null;
  drills: Drill[];
}

interface UseAnalysisIssueDetailsReturn {
  detailsByIssueId: Record<string, IssueDetails>;
  loading: boolean;
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

  useEffect(() => {
    if (!analysisId) {
      setDetailsByIssueId({});
      setLoading(false);
      return;
    }

    let isActive = true;
    setLoading(true);

    const load = async () => {
      try {
        const issues = await issueService.getIssuesByAnalysis(analysisId);
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
            drills: drillsMap[issue.id] ?? [],
          };
        }
        setDetailsByIssueId(next);
      } catch {
        setDetailsByIssueId({});
      } finally {
        if (isActive) setLoading(false);
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [analysisId]);

  return { detailsByIssueId, loading };
}
