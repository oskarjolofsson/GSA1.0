import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import AnalysisResultsReview from 'features/analysis/components/AnalysisResultsReview';
import analysisService from 'features/analysis/services/analysisService';
import type { AnalysisIssue } from 'features/analysis/types';
import { exitToHome } from 'features/shared/utils/exitToHome';

// DEBUG ONLY: jumps straight to the post-analysis review screen for one hardcoded
// analysis, skipping upload+processing. Delete once the review-screen bug is fixed.
const DEBUG_ANALYSIS_ID = '0a3ba45d-3410-46a7-8b4b-b2a4c1015663';

export default function DebugReview() {
  const router = useRouter();
  const [issues, setIssues] = useState<AnalysisIssue[] | null>(null);

  useEffect(() => {
    void analysisService.getAnalysisIssues(DEBUG_ANALYSIS_ID).then(setIssues);
  }, []);

  if (!issues) return <View style={{ flex: 1 }} />;

  return (
    <AnalysisResultsReview
      issues={issues}
      analysisId={DEBUG_ANALYSIS_ID}
      onNext={(areaKey) => exitToHome(router, areaKey)}
      onBack={() => exitToHome(router)}
    />
  );
}
