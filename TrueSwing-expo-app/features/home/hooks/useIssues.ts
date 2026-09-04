import { useCallback, useEffect, useState } from 'react';
import issueService from 'features/issues/services/issueService';
import type { Issue } from 'features/issues/types';
import { getErrorMessage } from 'lib/errors';

interface UseIssuesReturn {
  /** Every issue the golfer has: AI-diagnosed, coach-authored and browse-started. */
  issues: Issue[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * The golfer's issues, for the home screen's "could also work on" list.
 *
 * Formerly `useTodaysIssue`, which also fetched /issues/todays-issue/ for a server-chosen
 * default. Home derives its default tab from GET /programs/ instead. That endpoint is
 * untouched and still serves other callers.
 */

export default function useIssues(): UseIssuesReturn {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setError(null);
      const list = await issueService.getUserIssues();
      setIssues(list);
    } catch (err) {
      console.error('Error fetching issues:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { issues, loading, error, refetch };
}
