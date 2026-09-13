import { Pressable, Text, View } from 'react-native';

import type { ReviewIssue } from '../hooks/useAnalysisReview';
import type { IssueDetails } from '../hooks/useAnalysisIssueDetails';
import DrillList from './DrillList';

type FocusPointCardProps = {
  issue: ReviewIssue;
  details?: IssueDetails;
  detailsLoading: boolean;
  /** Set when the title/description/drills join failed outright, so this can say
   *  so instead of silently falling back to a bare confidence number. */
  detailsError?: string | null;
  onReject: () => void;
};

/**
 * One issue in the review list. Accept is implicit (default state, no button) —
 * Reject is the only action. Title/description/drills come from a separate join
 * (useAnalysisIssueDetails.ts) that lands shortly after the issue list itself, so
 * this shows a plain loading placeholder rather than blocking the whole screen on
 * it. Gold stroke voice per DESIGN.md: no green, no exclamation marks.
 */
export default function FocusPointCard({
  issue,
  details,
  detailsLoading,
  detailsError,
  onReject,
}: FocusPointCardProps) {
  return (
    <View className="mb-4 rounded-[24px] border border-white/10 bg-black/35 p-5">
      {details ? (
        <>
          <Text className="font-display text-[20px] leading-[26px] text-sand">{details.title}</Text>
          {!!details.description && (
            <Text className="mt-2 text-[13px] leading-[19px] text-sand-dim">{details.description}</Text>
          )}
          <DrillList drills={details.drills} />
        </>
      ) : detailsLoading ? (
        <View className="h-6 w-2/3 rounded-full bg-white/10" />
      ) : detailsError ? (
        <Text className="text-[13px] text-sand-dim">
          Couldn't load details for this issue ({detailsError}) — {Math.round(issue.confidence * 100)}% confidence.
        </Text>
      ) : (
        // Details join returned nothing for this issue_id specifically.
        <Text className="font-display text-[20px] leading-[26px] text-sand">
          {Math.round(issue.confidence * 100)}% confidence
        </Text>
      )}

      {issue.rejectFailed ? (
        <View className="mt-4 flex-row items-center justify-between">
          <Text className="text-[13px] text-sand-dim">Couldn't remove</Text>
          <Pressable
            onPress={onReject}
            accessibilityRole="button"
            className="min-h-[36px] items-center justify-center rounded-full border border-gold px-4 active:opacity-70">
            <Text className="font-sans-medium text-[13px] text-gold">Retry</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={onReject}
          accessibilityRole="button"
          className="mt-4 min-h-[36px] items-start justify-center active:opacity-70">
          <Text className="text-[13px] text-sand-dim">Reject</Text>
        </Pressable>
      )}
    </View>
  );
}
