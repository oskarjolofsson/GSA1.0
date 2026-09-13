import { FlatList, Pressable, Text, View } from 'react-native';

import useAnalysisReview from '../hooks/useAnalysisReview';
import useAnalysisIssueDetails from '../hooks/useAnalysisIssueDetails';
import type { AnalysisIssue } from '../types';
import FocusPointCard from './FocusPointCard';

type AnalysisResultsReviewProps = {
  issues: AnalysisIssue[];
  analysisId: string | null;
  /** Called with the area of the first surviving issue, so the caller can land
   *  the golfer on the home area these results belong to. */
  onNext: (areaKey?: string | null) => void;
  onBack: () => void;
};

/**
 * Replaces AnalysisComplete's role: instead of a generic "done" screen, this shows
 * the issues this analysis found so the user can reject one before it enters their
 * history. Continue always works — rejects are already immediate/independent
 * (see useAnalysisReview.ts), so there's nothing here to gate on. Title/description/
 * drills load in separately (useAnalysisIssueDetails.ts) and are joined onto each
 * card by issue_id; a card shows a placeholder until its details land instead of
 * the whole screen waiting.
 */
export default function AnalysisResultsReview({
  issues,
  analysisId,
  onNext,
  onBack,
}: AnalysisResultsReviewProps) {
  const { issues: reviewIssues, reject } = useAnalysisReview(issues);
  const {
    detailsByIssueId,
    loading: detailsLoading,
    error: detailsError,
  } = useAnalysisIssueDetails(analysisId);

  return (
    <View className="flex-1 bg-ink px-6 pt-16">
      <Text className="font-display text-[28px] leading-[34px] text-sand">Analysis complete</Text>
      <Text className="mt-2 text-[13px] leading-[19px] text-sand-dim">Your results are ready.</Text>

      {reviewIssues.length === 0 ? (
        <View className="mt-8 rounded-[24px] border border-white/10 bg-black/35 p-5">
          <Text className="text-[13px] text-sand-dim">No issues found for this analysis.</Text>
        </View>
      ) : (
        <FlatList
          className="mt-8"
          data={reviewIssues}
          keyExtractor={(item) => item.analysis_issue_id}
          renderItem={({ item }) => (
            <FocusPointCard
              issue={item}
              details={detailsByIssueId[item.issue_id]}
              detailsLoading={detailsLoading}
              detailsError={detailsError}
              onReject={() => reject(item.analysis_issue_id)}
            />
          )}
        />
      )}

      <View className="pb-6 pt-6">
        <Pressable
          onPress={() => onNext(detailsByIssueId[reviewIssues[0]?.issue_id]?.area)}
          accessibilityRole="button"
          className="min-h-[44px] w-full items-center justify-center rounded-full border border-gold px-6 py-4 active:opacity-70">
          <Text className="font-sans-medium text-[15px] text-gold">Continue</Text>
        </Pressable>

        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          className="mt-6 min-h-[44px] items-center justify-center active:opacity-70">
          <Text className="text-[13px] text-sand-dim">Film another swing</Text>
        </Pressable>
      </View>
    </View>
  );
}
