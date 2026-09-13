import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Check, ChevronLeft } from 'lucide-react-native';

import type { AnalysisIssue } from '../types';
import type { IssueDetails } from '../hooks/useAnalysisIssueDetails';

type Props = {
  keptIssues: AnalysisIssue[];
  rejectedCount: number;
  detailsByIssueId: Record<string, IssueDetails>;
  /** True while the batch of rejections is being sent to the backend --
   *  the only network call this whole screen makes, fired on Continue. */
  committing: boolean;
  /** Set when every rejection in the batch failed. Nothing was saved, so
   *  Continue is left pressable to retry rather than navigating away. */
  commitError: string | null;
  onContinue: () => void;
  /** Returns to the last card so a decision can be changed. Always safe --
   *  nothing is sent to the backend until Continue, so a rejected card is
   *  still just a local decision that Keep can reverse. */
  onBack: () => void;
};

/**
 * Shown once every card has a decision. Says the true thing about what
 * happened -- kept AND rejected counts, not just the happy path (DESIGN.md's
 * "say the true thing") -- and centers everything per feedback.
 */
export default function AnalysisSummaryScreen({
  keptIssues,
  rejectedCount,
  detailsByIssueId,
  committing,
  commitError,
  onContinue,
  onBack,
}: Props) {
  const keptNothing = keptIssues.length === 0;
  const focusWord = keptIssues.length === 1 ? 'focus goes' : 'focuses go';
  // "Won't show up again" is about existing history, not a permanent ban on
  // this issue type: the backend deactivates every past occurrence for the
  // user, but a future swing that shows the same fault gets flagged fresh.
  const rejectedLine =
    rejectedCount > 0
      ? `${rejectedCount} you rejected won't appear in your plan or history -- though a future swing can still flag the same issue again.`
      : 'Nothing was rejected.';

  return (
    <View
      className={`flex-1 items-center bg-ink px-6 ${keptNothing ? 'justify-center' : 'pt-16'}`}
    >
      <View className="items-center">
        <Text className="text-center font-display text-[28px] leading-[34px] text-sand">
          {keptNothing ? "You're all set" : "You're set"}
        </Text>
        <Text className="mt-2 text-center text-[13px] leading-[19px] text-sand-dim">
          {keptNothing
            ? "You rejected everything the AI found, so there's nothing new to add to your plan."
            : `${keptIssues.length} ${focusWord} into your plan. ${rejectedLine}`}
        </Text>
      </View>

      {!keptNothing ? (
        <View className="mt-7 w-full flex-1 items-center">
          <View className="w-full max-w-[280px]">
            <Text className="text-center text-[10px] font-sans-semibold uppercase tracking-[2.6px] text-sand-dim">
              Added to your plan
            </Text>

            {keptIssues.map((issue) => {
              const details = detailsByIssueId[issue.issue_id];
              return (
                <View
                  key={issue.analysis_issue_id}
                  className="mt-3.5 items-center border-t border-white/[.07] pt-3.5"
                >
                  <Check size={16} color="#E4C892" />
                  <Text className="mt-1.5 font-display text-[17px] text-sand">
                    {details?.title ?? 'Untitled focus'}
                  </Text>
                  <Text className="mt-0.5 text-[12px] text-sand-dim">
                    {Math.round(issue.confidence * 100)}% confidence
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      <View className="w-full px-6 pb-6">
        {commitError ? (
          <Text className="mb-3 text-center text-[13px] leading-[19px] text-danger">
            {commitError}
          </Text>
        ) : null}

        <Pressable
          onPress={onBack}
          disabled={committing}
          accessibilityRole="button"
          accessibilityLabel="Back to review"
          className="mb-4 min-h-[36px] flex-row items-center justify-center gap-1 active:opacity-70"
          style={{ opacity: committing ? 0.4 : 1 }}>
          <ChevronLeft size={15} color="#8A8676" />
          <Text className="text-[13px] text-sand-dim">Back to review</Text>
        </Pressable>

        <Pressable
          onPress={onContinue}
          disabled={committing}
          accessibilityRole="button"
          className="min-h-[44px] w-full flex-row items-center justify-center gap-2 rounded-full border border-gold px-6 py-4 active:opacity-70"
          style={{ opacity: committing ? 0.6 : 1 }}>
          {committing ? <ActivityIndicator size="small" color="#E4C892" /> : null}
          <Text className="font-sans-medium text-[15px] text-gold">
            {committing ? 'Saving…' : 'Continue'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
