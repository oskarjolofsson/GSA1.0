import { useEffect, useState } from 'react';
import {
  fetchTaxonomy,
  readCachedTaxonomy,
  type TaxonomyTerm,
} from 'features/library/services/taxonomyService';

/**
 * The parts of the game, for the home tabs.
 *
 * Reads the cache first so the tab row paints on the first frame; the network refresh
 * corrects it in place. On total failure the list is empty and HomeScreen renders the body
 * without tabs -- degraded but honest.
 */
export default function useAreas(): { areas: TaxonomyTerm[]; loading: boolean } {
  const [areas, setAreas] = useState<TaxonomyTerm[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const cached = await readCachedTaxonomy();
        if (alive && cached?.areas?.length) {
          setAreas(cached.areas);
          setLoading(false);
        }
      } catch {
        // A bad cache blob is not worth reporting; the fetch below is
        // the real source.
      }

      try {
        const fresh = await fetchTaxonomy();
        if (alive) setAreas(fresh.areas ?? []);
      } catch (err) {
        console.error('Error fetching taxonomy areas:', err);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return { areas, loading };
}
