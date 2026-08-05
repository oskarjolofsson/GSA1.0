import { useCallback, useEffect, useState } from 'react';
import { listPrograms } from '../services/programService';
import type { ProgramSummary } from '../types';
import { getErrorMessage } from 'lib/errors';

interface UseProgramsReturn {
  /** Every open program, newest first. */
  programs: ProgramSummary[];
  /** The same programs keyed by taxonomy area, for the area tabs. */
  byArea: Record<string, ProgramSummary[]>;
  /** Issue ids that already have an open program — used to work out which
   *  issues are still startable without trusting `issue.program_status`. */
  activeIssueIds: Set<string>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Everything the golfer has open, in one request.
 *
 * The home screen renders every area from this, so switching between areas is a
 * local filter rather than a fetch. No cache: the call is cheap (the backend
 * batches it to a fixed number of queries however many programs there are) and a
 * cache here would be a third invalidation path to get wrong after completing a
 * session.
 */
export default function usePrograms(): UseProgramsReturn {
  const [programs, setPrograms] = useState<ProgramSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setError(null);
      const list = await listPrograms();
      setPrograms(list);
    } catch (err) {
      console.error('Error fetching programs:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Programs whose area is null (pre-taxonomy rows) are grouped under no area
  // and so never surface on a tab. They are still reachable from the analysis
  // reel, and they disappear on their own once completed.
  const byArea: Record<string, ProgramSummary[]> = {};
  for (const program of programs) {
    if (!program.area) continue;
    (byArea[program.area] ??= []).push(program);
  }

  const activeIssueIds = new Set(
    programs.map((p) => p.issue_id).filter((id): id is string => !!id)
  );

  return { programs, byArea, activeIssueIds, loading, error, refetch };
}
