import { useCallback, useEffect, useState } from 'react';

import type { DrillRun } from 'features/drill/types/DrillRun';

import { getPracticeSessionResults } from '../services/sessionService';

/**
 * What the golfer scored this session, drill by drill.
 *
 * ONE FETCH, NOT TWO. This used to `await loadSession()` and then `await loadResults()` in
 * sequence -- two serial round trips before anything rendered, and the session it fetched
 * was never read by the screen.
 *
 * IT OWNS ITS OWN FAILURE. The completion screen renders everything that matters (the
 * fraction, what's next, Continue) from the `StepAdvance` it already holds, so a failure
 * here must degrade this section alone. DESIGN.md: "Independent fetches fail independently.
 * A screen that can render from one source must render." Blocking Continue because a list of
 * numbers failed to load would cost the golfer their next session over cosmetics.
 */

interface UsePracticeResultsStateReturn {
  drillRuns: DrillRun[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function usePracticeResultsState({
  sessionId,
}: {
  sessionId: string | null;
}): UsePracticeResultsStateReturn {
  const [drillRuns, setDrillRuns] = useState<DrillRun[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(sessionId));
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState<number>(0);

  useEffect(() => {
    if (!sessionId) {
      setDrillRuns([]);
      setLoading(false);
      return;
    }

    let alive = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const results = await getPracticeSessionResults(sessionId);
        if (!alive) return;
        setDrillRuns(results);
      } catch (err) {
        if (!alive) return;
        // Caught, not re-raised. The old hook threw out of an async effect, which is
        // an unhandled rejection that no caller could act on.
        setError(err instanceof Error ? err.message : 'Failed to load your scores');
        setDrillRuns([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    void load();

    return () => {
      alive = false;
    };
  }, [sessionId, reloadToken]);

  const retry = useCallback(() => setReloadToken((token) => token + 1), []);

  return { drillRuns, loading, error, retry };
}
