import { useEffect, useRef } from 'react';

import analysisService from '../services/analysisService';
import type { Analysis } from '../types';

/**
 * Stamps `reviewed_at` the first time an analysis is shown as the active item
 * in the home reel. Fire-and-forget: never blocks UI. Retries once silently on
 * failure, then just logs — a stuck "NEW" badge is cosmetic. Guards against
 * re-stamping the same analysis id more than once per session (e.g. scrolling
 * back and forth in the reel).
 */
export default function useMarkAnalysisReviewed(activeAnalysis: Analysis | null | undefined) {
  const stampedIds = useRef(new Set<string>());

  useEffect(() => {
    if (!activeAnalysis || activeAnalysis.reviewed_at) return;

    const { analysis_id: analysisId } = activeAnalysis;
    if (stampedIds.current.has(analysisId)) return;
    stampedIds.current.add(analysisId);

    analysisService.markAnalysisReviewed(analysisId).catch(() =>
      analysisService.markAnalysisReviewed(analysisId).catch((err) => {
        console.error('Error marking analysis reviewed:', err);
      })
    );
  }, [activeAnalysis]);
}
