import { useCallback, useEffect, useMemo, useState } from 'react';

import { DrillService } from 'features/drill/services/drillService';
import type { Drill } from 'features/drill/types/Drill';
import type { Issue } from 'features/issues/types';

/**
 * Which drills this practice run works through, and where we are in them.
 *
 * The fetch is keyed on the ISSUE and the step's subset is a derivation, so continuing into
 * the next step filters an already-loaded list instead of re-requesting an identical one.
 */

// Module-scope on purpose: constructed in the hook body, a new identity every render turns
// into an infinite refetch the moment exhaustive-deps adds it to the effect's deps.
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
   * Identifies THIS run, so the queue restarts at the first drill. Pass the practice
   * session id.
   *
   * Not derivable from the issue or the drill ids: two consecutive steps often prescribe
   * the SAME drills, leaving `drillIdsKey` unchanged and the reset below unfired.
   */
  runKey?: string | null
): DrillQueue {
  // Joined into a stable primitive: a fresh array literal every render would re-fire the
  // derivation and the index reset.
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

  // A program step runs only its own drills, in its own order. Ids the catalog no longer
  // returns are dropped rather than rendered as holes.
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
