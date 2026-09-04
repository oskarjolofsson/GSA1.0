import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { useHomeAnalysis } from 'features/home/context/HomeAnalysisContext';
import type { Issue } from 'features/issues/types';
import type { ProgramContext, StepAdvance } from 'features/programs/types';
import ErrorState from 'features/shared/components/ErrorState';

import { useDrillQueue } from './hooks/useDrillQueue';
import { usePracticeFlowSequence } from './hooks/usePracticeFlowSequence';
import { usePracticeRunner, type SessionOutcome } from './hooks/usePracticeRunner';
import DrillPracticeScreen from './screens/DrillPracticeScreen';
import SessionCompleteScreen from './screens/SessionCompleteScreen';
import type { PracticeSession } from './types';

/**
 * A range visit: work through a step's drills, then either continue into the next step or
 * stop for the day.
 *
 * The hooks live here rather than in the screens (ADR-0022). Note the explicit
 * `goToPractice()` on continue: `useScreenSequence` keeps `currentIndex` in local state, so
 * handing down a new session does NOT by itself move the screen.
 */

type PracticeFlowProps = {
  onBack: () => void;
  selectedIssue: Issue;
  selectedSession: PracticeSession | null;
  programContext?: ProgramContext | null;
  /** Starts the next session upstream. Resolves false when it could not. */
  onRequestContinue: (advance: StepAdvance) => Promise<boolean>;
};

export default function PracticeFlow({
  onBack,
  selectedIssue,
  selectedSession,
  programContext,
  onRequestContinue,
}: PracticeFlowProps) {
  const { currentScreen, goToResult, goToPractice } = usePracticeFlowSequence();
  const [outcome, setOutcome] = useState<SessionOutcome | null>(null);
  useHomeAnalysis();

  // The session id is what says "this is a new run", so the queue starts from drill one.
  // Two consecutive steps can prescribe the same two drills, in which case nothing else in
  // the arguments changes.
  const queue = useDrillQueue(
    selectedIssue ?? null,
    programContext?.drillIds,
    selectedSession?.id ?? null
  );

  const handleSessionCompleted = useCallback(
    (next: SessionOutcome) => {
      setOutcome(next);
      goToResult();
    },
    [goToResult]
  );

  const { status, completeBlock } = usePracticeRunner({
    session: selectedSession,
    queue,
    programContext,
    onSessionCompleted: handleSessionCompleted,
  });

  const handleContinue = useCallback(async () => {
    if (!outcome || outcome.kind !== 'advanced') return false;
    const started = await onRequestContinue(outcome.advance);
    if (!started) return false;
    // The session swap alone would leave us on the completion screen.
    setOutcome(null);
    goToPractice();
    return true;
  }, [outcome, onRequestContinue, goToPractice]);

  // Any issue with an id is practiceable (AI, coach, or browse). A custom issue has no
  // analysis_issue_id and that is fine -- the program drives practice.
  if (!selectedIssue?.id) {
    return (
      <ErrorState title="No issue selected for practice" buttonText="Go back" onRetry={onBack} />
    );
  }

  if (!selectedSession) {
    return (
      <ErrorState
        title="No active session found for this practice run"
        buttonText="Go back"
        onRetry={onBack}
      />
    );
  }

  const focusTitle = selectedIssue.layman_title || selectedIssue.title;

  return (
    <View style={{ flex: 1 }}>
      {currentScreen === 'Practice' && (
        <DrillPracticeScreen
          status={status}
          activeDrill={queue.activeDrill}
          drillNumber={queue.drillNumber}
          totalDrills={queue.totalDrills}
          onCompleteBlock={completeBlock}
          onGiveUp={onBack}
        />
      )}

      {currentScreen === 'Result' && outcome && (
        <SessionCompleteScreen
          session={selectedSession}
          focusTitle={focusTitle}
          outcome={outcome}
          onContinue={handleContinue}
          onExit={onBack}
        />
      )}
    </View>
  );
}
