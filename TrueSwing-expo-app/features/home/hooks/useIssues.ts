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
 * WAS `useTodaysIssue`, and it used to make a second request to
 * /issues/todays-issue/ for a server-chosen default. Home no longer needs one:
 * the default area tab comes from the newest open program in GET /programs/,
 * which is already in hand. That endpoint returns the top of a confidence-ordered
 * list and its own docstring calls that "a tiebreaker rather than a considered
 * answer" — not worth a round trip on every app foreground to pick a default tab.
 *
 * The endpoint itself is untouched and still serves other callers.
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
