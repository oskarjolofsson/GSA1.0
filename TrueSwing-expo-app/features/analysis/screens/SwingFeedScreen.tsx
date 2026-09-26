import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import AnalysisResultScreen from 'features/analysis/screens/AnalysisResultScreen';
import LoadingState from 'features/shared/components/LoadingState';
import useHomeAnalysisController from 'features/home/hooks/useHomeAnalysisController';
import { HomeAnalysisProvider } from 'features/home/context/HomeAnalysisContext';

/**
 * The swing reel as a route, opened from the profile grid at `?id=<analysis_id>`.
 *
 * It mounts its OWN analysis controller rather than reaching for home's. Home's provider
 * is rendered inside `HomeFlow` on a sibling tab; a screen pushed from profile cannot see
 * it, and hoisting it to the root would make the whole app wait on one fetch. The two
 * copies drift only until either refetches on focus.
 *
 * NOTHING RENDERS UNTIL THE INDEX IS RESOLVED. `AnalysisResultScreen` hands its FlatList an
 * `initialScrollIndex`, which is read once at mount -- render it before the tapped swing is
 * found and the reel opens on the newest swing instead, then silently stays there.
 */
export default function SwingFeedScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();

  const controller = useHomeAnalysisController();
  const { allAnalyses, loading, setActiveAnalysisIndex } = controller;
  const [positioned, setPositioned] = useState(false);

  useEffect(() => {
    if (positioned) return;
    // Still the first fetch. An empty list with loading finished is a real answer
    // (no swings, or the fetch failed) and the reel renders its own state for it.
    if (loading && !allAnalyses.length) return;

    const index = id ? allAnalyses.findIndex((a) => a.analysis_id === id) : -1;
    // A swing deleted between the grid painting and this opening lands on index 0,
    // which is the newest -- a wrong swing beats a blank screen.
    if (index > 0) setActiveAnalysisIndex(index);
    setPositioned(true);
  }, [positioned, loading, allAnalyses, id, setActiveAnalysisIndex]);

  if (!positioned) {
    return <LoadingState title="Loading swings" subtitle="" />;
  }

  return (
    <HomeAnalysisProvider value={controller}>
      <AnalysisResultScreen onBack={() => router.back()} />
    </HomeAnalysisProvider>
  );
}
