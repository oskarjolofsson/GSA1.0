import { useCallback, useEffect, useMemo, useState } from 'react';

import { DrillService } from 'features/drill/services/drillService';
import type { Drill } from 'features/drill/types/Drill';
import type { Issue } from 'features/issues/types';

/**
 * Which drills this practice run works through, and where we are in them.
 *
 * Split out of the old `usePracticeScreenState`, which fetched drills AND ran the
 * drill-run lifecycle AND ended the session AND accumulated grades AND completed the
 * program step. `features/CLAUDE.md`: if a hook needs an "and" to describe it, split it.
 *
 * THE FETCH IS KEYED ON THE ISSUE, THE FILTER IS A DERIVATION. This is the whole reason
 * the two concerns are worth separating. A program step names a subset of the issue's
 * drills, and continuing into the next step keeps the same issue while changing that
 * subset. Keying the fetch on the subset made "Continue practice" re-request an identical
 * list from the network just to filter it differently -- latency on the one tap in this
 * feature that is supposed to feel instant.
 */

// Stateless wrapper around `apiClient`, so one instance for the module rather than one
// per render. Constructing it in the hook body armed a trap: the moment anyone added it
// to the fetch effect's dependency array (which an exhaustive-deps autofix will
// eventually suggest) a new identity every render becomes an infinite refetch loop.
const drillService = new DrillService();

export interface DrillQueue {
  /** The drills for this run, already narrowed and ordered by the step. */
  drills: Drill[];
  activeDrill: Drill | null;
  /** 1-based, for display. Clamped so it never reads "3 of 2" past the end. */
  drillNumber: number;
  totalDrills: number;
  isLastDrill: boolean;
  advance: () => void;
  /** Re-run the fetch after a failure. */
  retryLoad: () => void;
  loading: boolean;
  error: string | null;
}

export function useDrillQueue(
  issue: Issue | null,
  drillIds?: string[] | null,
  /**
   * Identifies THIS run, so the queue starts from the first drill again when a new one
   * begins. Pass the practice session id.
   *
   * Not derivable from the issue or the drill ids, which is the whole reason it is a
   * separate argument. `_pick_due_drills` chooses the two lowest-strength drills, so two
   * consecutive steps very often prescribe the SAME two drills -- and then `drillIdsKey` is
   * unchanged, the reset below never fires, and a golfer who taps "Continue practice" lands
   * in the new session already on "Drill 2 of 2" with the first drill skipped.
   */
  runKey?: string | null
): DrillQueue {
  // Joined so the value is a stable primitive: a fresh array literal every render
  // would re-fire the derivation and the index reset on every keystroke upstream.
  const drillIdsKey = drillIds?.length ? drillIds.join(',') : null;
  const issueId = issue?.id ?? null;

  const [allDrills, setAllDrills] = useState<Drill[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState<number>(0);
  const [reloadToken, setReloadToken] = useState<number>(0);

  useEffect(() => {
    if (!issueId) {
      setAllDrills([]);
      setLoading(false);
      return;
    }

    let alive = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetched = await drillService.getDrillsByIssue(issueId);
        if (!alive) return;
        setAllDrills(fetched);
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : 'Failed to load drills');
        setAllDrills([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    void load();

    return () => {
      alive = false;
    };
  }, [issueId, reloadToken]);

  // A program step runs only its own drills, in its own order. Ids the server named but
  // the catalog no longer returns are dropped rather than rendered as holes.
  const drills = useMemo<Drill[]>(() => {
    if (!drillIdsKey) return allDrills;
    return drillIdsKey
      .split(',')
      .map((id) => allDrills.find((drill) => drill.id === id))
      .filter((drill): drill is Drill => Boolean(drill));
  }, [allDrills, drillIdsKey]);

  // Back to the first drill whenever the run itself changes.
  useEffect(() => {
    setIndex(0);
  }, [issueId, drillIdsKey, runKey]);

  const activeDrill = index < drills.length ? drills[index] : null;
  const advance = useCallback(() => setIndex((current) => current + 1), []);
  const retryLoad = useCallback(() => setReloadToken((token) => token + 1), []);

  return {
    drills,
    activeDrill,
    drillNumber: drills.length === 0 ? 0 : Math.min(index + 1, drills.length),
    totalDrills: drills.length,
    isLastDrill: drills.length > 0 && index >= drills.length - 1,
    advance,
    retryLoad,
    loading,
    error,
  };
}
