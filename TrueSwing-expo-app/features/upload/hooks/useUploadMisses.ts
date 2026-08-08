import { useCallback, useEffect, useState } from 'react';

import {
  fetchTaxonomy,
  readCachedTaxonomy,
  type TaxonomyMiss,
} from 'features/library/services/taxonomyService';
import { getErrorMessage } from 'lib/errors';

/** The analysis prompt is area-scoped server-side and defaults to FULL_SWING, so
 *  the upload flow offers that area's misses rather than an area picker. Same
 *  reasoning as the film hand-off gate in features/library/components/MissList.tsx —
 *  relax it only when the chosen area is threaded through the upload flow. */
const ANALYSIS_AREA = 'FULL_SWING';

type Status = 'loading' | 'ready' | 'error';

export type UseUploadMissesReturn = {
  misses: TaxonomyMiss[];
  status: Status;
  error: string | null;
  retry: () => void;
};

/** The miss vocabulary for the upload prompt, read from the taxonomy rather than
 *  a local list. The screen used to hardcode its own chips, and two of them
 *  ("Shank", "Toe") were not in the backend vocabulary at all — the golfer could
 *  hand the analysis a term it had never been taught. Cache-first for the same
 *  reason the library is: the taxonomy is admin-edited occasionally and read
 *  constantly, so a cold network should not block the screen. */
export function useUploadMisses(): UseUploadMissesReturn {
  const [misses, setMisses] = useState<TaxonomyMiss[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);

    const cached = await readCachedTaxonomy();
    if (cached) {
      setMisses(cached.misses_by_area[ANALYSIS_AREA] ?? []);
      setStatus('ready');
    }

    try {
      const taxonomy = await fetchTaxonomy();
      setMisses(taxonomy.misses_by_area[ANALYSIS_AREA] ?? []);
      setStatus('ready');
    } catch (err) {
      // A stale cache still lets the golfer finish the upload; only a cold
      // failure is worth a visible error.
      if (!cached) {
        setError(getErrorMessage(err));
        setStatus('error');
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { misses, status, error, retry: () => void load() };
}
