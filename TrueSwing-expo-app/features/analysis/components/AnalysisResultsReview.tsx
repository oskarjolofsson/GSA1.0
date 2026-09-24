import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronLeft, Check, List, X } from 'lucide-react-native';
import { AnimatePresence, MotiView } from 'moti';

import useAnalysisIssueDetails from '../hooks/useAnalysisIssueDetails';
import useVideoURL from '../hooks/useVideoURL';
import analysisService from '../services/analysisService';
import type { Analysis, AnalysisIssue } from '../types';
import InlineSwingVideo from './InlineSwingVideo';
import FocusDrillsSheet from './FocusDrillsSheet';
import AnalysisSummaryScreen from './AnalysisSummaryScreen';
import colors from 'lib/colors';

const SAND_DIM = colors['sand-dim'];
const SAND = colors.sand;

type AnalysisResultsReviewProps = {
  issues: AnalysisIssue[];
  analysisId: string | null;
  onNext: (areaKey?: string | null) => void;
  onBack: () => void;
};

/**
 * Post-analysis review. Per DESIGN.md: no gradients, no green (brand has
 * none), `danger` stays reserved for real failures so it's dropped from
 * Reject/Keep -- both are equal-weight outline pills told apart by icon +
 * label, never colour alone.
 *
 * Decisions are LOCAL ONLY until Continue: Keep/Reject just record a choice
 * in `decisions` and advance -- nothing hits the backend. `issues` itself
 * never shrinks, so Back always has something valid to land on (no more
 * "activeIssue is undefined" dead end from the old shrinking-array design).
 * The actual dismiss calls (analysisService.dismissAnalysisIssue) fire once,
 * in a batch, only when Continue is pressed on the summary screen -- so a
 * golfer bouncing back and forth changing their mind never sends a request
 * they might reverse a second later.
 *
 * One card at a time, no swipe gesture: Keep/Reject/Back drive navigation
 * instead, so there's no swipe-vs-tap ambiguity with the video underneath.
 * Video is the one flexible element (InlineSwingVideo, flex:1 + aspect
 * ratio) -- it fills whatever the text block doesn't need, so there's never
 * leftover empty space.
 */
export default function AnalysisResultsReview({
  issues,
  analysisId,
  onNext,
  onBack,
}: AnalysisResultsReviewProps) {
  const {
    detailsByIssueId,
    loading: detailsLoading,
    error: detailsError,
  } = useAnalysisIssueDetails(analysisId);

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  useEffect(() => {
    if (!analysisId) return;
    void analysisService.getAnalysisById(analysisId).then(setAnalysis);
  }, [analysisId]);
  const videoURL = useVideoURL(analysis);

  const [activeIndex, setActiveIndex] = useState(0);
  // Keyed by analysis_issue_id. A card with no entry yet counts as "kept" once
  // the golfer reaches the end -- Keep is the implicit default, same as the
  // old per-card design.
  const [decisions, setDecisions] = useState<Record<string, 'kept' | 'rejected'>>({});
  const [drillsOpen, setDrillsOpen] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  // Which way the card just left: Keep slides right, Reject slides left --
  // read by the exiting card's own animation below.
  const [exitDirection, setExitDirection] = useState<'left' | 'right'>('right');

  const done = issues.length > 0 && activeIndex >= issues.length;
  const activeIssue = issues[activeIndex] ?? null;
  const activeDetails = activeIssue ? detailsByIssueId[activeIssue.issue_id] : undefined;
  // Set only when Back has been used to revisit a card already decided --
  // marks which button reflects the current choice, so it's clear it can
  // still be changed rather than looking like a fresh, undecided card.
  const currentDecision = activeIssue ? decisions[activeIssue.analysis_issue_id] : undefined;

  const handleKeep = useCallback(() => {
    if (!activeIssue) return;
    setExitDirection('right');
    setDecisions((prev) => ({ ...prev, [activeIssue.analysis_issue_id]: 'kept' }));
    setActiveIndex((index) => index + 1);
  }, [activeIssue]);

  const handleReject = useCallback(() => {
    if (!activeIssue) return;
    setExitDirection('left');
    setDecisions((prev) => ({ ...prev, [activeIssue.analysis_issue_id]: 'rejected' }));
    setActiveIndex((index) => index + 1);
  }, [activeIssue]);

  const handleBack = useCallback(() => {
    setActiveIndex((index) => Math.max(index - 1, 0));
  }, []);

  // From the summary screen: re-shows the last card so a decision can still
  // be changed. Always valid -- `issues` never shrinks, and this screen only
  // renders once issues.length > 0.
  const handleBackFromSummary = useCallback(() => {
    setActiveIndex(issues.length - 1);
  }, [issues.length]);

  const keptIssues = useMemo(
    () => issues.filter((issue) => decisions[issue.analysis_issue_id] !== 'rejected'),
    [issues, decisions]
  );
  const rejectedIds = useMemo(
    () => issues.filter((issue) => decisions[issue.analysis_issue_id] === 'rejected'),
    [issues, decisions]
  );
  const keptAreaKey = useMemo(
    () => detailsByIssueId[keptIssues[0]?.issue_id]?.area,
    [detailsByIssueId, keptIssues]
  );

  // The one point anything reaches the backend: fire every rejection as a
  // batch. A total failure keeps the golfer on the summary with a retryable
  // error -- nothing was actually saved, so leaving would silently lose the
  // rejections. A partial failure just logs and proceeds: some got through,
  // and there's no sensible per-item retry UI left to build on this screen.
  const handleContinue = useCallback(async () => {
    if (rejectedIds.length === 0) {
      onNext(keptAreaKey);
      return;
    }

    setCommitting(true);
    setCommitError(null);
    const results = await Promise.allSettled(
      rejectedIds.map((issue) => analysisService.dismissAnalysisIssue(issue.analysis_issue_id))
    );
    const failures = results.filter((result) => result.status === 'rejected');
    setCommitting(false);

    if (failures.length === rejectedIds.length) {
      console.error('AnalysisResultsReview: failed to commit any rejections', failures);
      setCommitError("Couldn't save your rejections. Check your connection and try again.");
      return;
    }
    if (failures.length > 0) {
      console.error('AnalysisResultsReview: some rejections failed to commit', failures);
    }
    onNext(keptAreaKey);
  }, [rejectedIds, keptAreaKey, onNext]);

  if (issues.length === 0) {
    return (
      <View className="flex-1 items-center bg-ink px-6 pt-16">
        <Text className="text-center font-display text-[28px] leading-[34px] text-sand">
          Analysis complete
        </Text>
        <View className="mt-8 w-full rounded-[24px] border border-white/10 bg-black/35 p-5">
          <Text className="text-[13px] text-sand-dim">No issues found for this analysis.</Text>
        </View>
        <View className="w-full flex-1 justify-end pb-6">
          <Pressable
            onPress={() => onNext(null)}
            accessibilityRole="button"
            className="min-h-[44px] w-full items-center justify-center rounded-full border border-gold px-6 py-4 active:opacity-70">
            <Text className="font-sans-medium text-[15px] text-gold">Continue</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (done) {
    return (
      <AnalysisSummaryScreen
        keptIssues={keptIssues}
        rejectedCount={rejectedIds.length}
        detailsByIssueId={detailsByIssueId}
        committing={committing}
        commitError={commitError}
        onContinue={() => void handleContinue()}
        onBack={handleBackFromSummary}
      />
    );
  }

  return (
    <View className="flex-1 bg-ink pt-16">
      <View className="px-6">
        <Text className="font-display text-[28px] leading-[34px] text-sand">Analysis complete</Text>
        <Text className="mt-2 text-[13px] leading-[19px] text-sand-dim">
          Review what the AI found below, and reject anything that doesn&apos;t look right before
          it enters your plan.
        </Text>
      </View>

      <View className="flex-1 px-6 pt-2" style={{ minHeight: 0 }}>
        <InlineSwingVideo videoURL={videoURL} analysisId={analysisId} active />

        <View className="pb-6 pt-4">
          {/* No exitBeforeEnter: the incoming card animates in WHILE the outgoing
              one animates out, overlapping instead of waiting its turn -- that
              serial wait is what read as "laggy" here. Spring instead of a fixed
              timing curve so it settles naturally rather than stopping dead at
              a duration boundary. */}
          <AnimatePresence>
            <MotiView
              key={activeIssue?.analysis_issue_id ?? 'none'}
              from={{ opacity: 0, translateX: exitDirection === 'right' ? -24 : 24 }}
              animate={{ opacity: 1, translateX: 0 }}
              exit={{ opacity: 0, translateX: exitDirection === 'right' ? 60 : -60 }}
              transition={{ type: 'spring', damping: 24, stiffness: 260, mass: 0.6 }}
            >
              <Text className="font-sans-semibold text-[10px] uppercase tracking-[2.6px] text-gold">
                {Math.round((activeIssue?.confidence ?? 0) * 100)}% confidence
              </Text>
              <Text className="mt-1.5 font-display text-[22px] leading-[27px] text-sand">
                {activeDetails?.title ?? (detailsLoading ? 'Loading…' : 'Untitled focus')}
              </Text>

              {activeDetails?.missLabels.length ? (
                <View className="mt-2 flex-row flex-wrap gap-1.5">
                  {activeDetails.missLabels.map((label) => (
                    <View
                      key={label}
                      className="rounded-full border border-white/[.13] px-2 py-0.5">
                      <Text className="text-[10px] text-sand-dim">{label}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {detailsError ? (
                <Text className="mt-1.5 text-[14px] leading-[20px] text-sand-dim">
                  Couldn&apos;t load details ({detailsError}).
                </Text>
              ) : !!activeDetails?.description ? (
                <Text className="mt-1.5 text-[14px] leading-[20px] text-sand-dim">
                  {activeDetails.description}
                </Text>
              ) : null}

              <Pressable
                onPress={() => setDrillsOpen(true)}
                accessibilityRole="button"
                className="mt-3.5 min-h-[40px] flex-row items-center justify-center gap-2 rounded-full border border-white/[.13] active:opacity-70">
                <List size={15} color={SAND_DIM} />
                <Text className="text-[13px] font-sans-medium text-sand-dim">
                  Drills ({activeDetails?.drills.length ?? 0})
                </Text>
              </Pressable>

              <View className="mt-3.5 flex-row gap-3">
                <Pressable
                  onPress={handleReject}
                  accessibilityRole="button"
                  accessibilityLabel="Reject this focus"
                  accessibilityState={{ selected: currentDecision === 'rejected' }}
                  className="min-h-[48px] flex-1 flex-row items-center justify-center gap-2 rounded-[14px] border active:opacity-70"
                  style={{
                    borderColor:
                      currentDecision === 'rejected' ? SAND_DIM : 'rgba(255,255,255,0.13)',
                    borderWidth: currentDecision === 'rejected' ? 1.5 : 1,
                  }}>
                  <X size={16} color={SAND_DIM} />
                  <Text className="text-[14px] font-sans-medium text-sand-dim">
                    {currentDecision === 'rejected' ? 'Rejected' : 'Reject'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleKeep}
                  accessibilityRole="button"
                  accessibilityLabel="Keep this focus"
                  accessibilityState={{ selected: currentDecision === 'kept' }}
                  className="min-h-[48px] flex-1 flex-row items-center justify-center gap-2 rounded-[14px] border active:opacity-70"
                  style={{
                    borderColor: currentDecision === 'kept' ? SAND : 'rgba(255,255,255,0.13)',
                    borderWidth: currentDecision === 'kept' ? 1.5 : 1,
                  }}>
                  <Check size={16} color={SAND} />
                  <Text className="text-[14px] font-sans-medium text-sand">
                    {currentDecision === 'kept' ? 'Kept' : 'Keep'}
                  </Text>
                </Pressable>
              </View>
            </MotiView>
          </AnimatePresence>

          <View className="mt-4 flex-row items-center justify-center">
            <Pressable
              onPress={handleBack}
              disabled={activeIndex === 0}
              accessibilityRole="button"
              accessibilityLabel="Back to previous focus"
              accessibilityState={{ disabled: activeIndex === 0 }}
              className="absolute left-0 h-9 w-9 items-center justify-center rounded-full border border-white/[.13] active:opacity-70"
              style={{ opacity: activeIndex === 0 ? 0.35 : 1 }}>
              <ChevronLeft size={15} color={SAND_DIM} />
            </Pressable>

            <View className="flex-row gap-2">
              {issues.map((issue, index) => (
                <View
                  key={issue.analysis_issue_id}
                  className={`h-1.5 w-1.5 rounded-full ${
                    index === activeIndex ? 'bg-gold' : 'bg-white/[.15]'
                  }`}
                />
              ))}
            </View>
          </View>
        </View>
      </View>

      <FocusDrillsSheet
        title={activeDetails?.title ?? null}
        drills={activeDetails?.drills ?? []}
        visible={drillsOpen}
        onClose={() => setDrillsOpen(false)}
      />
    </View>
  );
}
