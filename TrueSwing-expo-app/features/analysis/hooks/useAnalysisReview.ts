import { useCallback, useState } from 'react';

import analysisService from '../services/analysisService';
import type { AnalysisIssue } from '../types';

export interface ReviewIssue extends AnalysisIssue {
  /** Set when the last reject attempt for this issue failed. */
  rejectFailed?: boolean;
}

interface UseAnalysisReviewReturn {
  issues: ReviewIssue[];
  reject: (analysisIssueId: string) => void;
}

/**
 * Local review state for one analysis's issues, following the same immediate-call
 * convention as HomeScreen's remove-issue flow (features/home/screens/HomeScreen.tsx):
 * reject fires `dismissAnalysisIssue` right away, no batching/confirm step. The list
 * updates optimistically; a failure re-adds the issue with `rejectFailed` so the card
 * can offer a per-item retry instead of a global error banner.
 */
export default function useAnalysisReview(initialIssues: AnalysisIssue[]): UseAnalysisReviewReturn {
  const [issues, setIssues] = useState<ReviewIssue[]>(() => initialIssues.map((issue) => ({ ...issue })));

  const reject = useCallback((analysisIssueId: string) => {
    let removed: ReviewIssue | undefined;
    setIssues((prev) => {
      removed = prev.find((issue) => issue.analysis_issue_id === analysisIssueId);
      return prev.filter((issue) => issue.analysis_issue_id !== analysisIssueId);
    });

    analysisService.dismissAnalysisIssue(analysisIssueId).catch(() => {
      setIssues((prev) => {
        // Already back in the list (e.g. a stale/duplicate call) — don't double-add.
        if (prev.some((issue) => issue.analysis_issue_id === analysisIssueId)) return prev;
        if (!removed) return prev;
        return [...prev, { ...removed, rejectFailed: true }];
      });
    });
  }, []);

  return { issues, reject };
}
