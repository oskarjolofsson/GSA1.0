import { useHomeFlowSequence } from 'features/home/hooks/useHomeFlowSequence';
import HomeScreen from 'features/home/screens/HomeScreen';
import AnalysisResultScreen from 'features/analysis/screens/AnalysisResultScreen';
import PracticeFlow from 'features/practice/practiceFlow';
import SwingHistoryScreen from 'features/progress/screens/SwingHistoryScreen';
import useHomeAnalysisController from 'features/home/hooks/useHomeAnalysisController';
import { HomeAnalysisProvider } from 'features/home/context/HomeAnalysisContext';
import type { Issue } from 'features/issues/types';
import { startPracticeSession } from 'features/practice/services/sessionService';
import type { PracticeSession } from 'features/practice/types';
import { useRequirePremium } from 'features/billing/hooks/useRequirePremium';
import {
  getActiveProgramByIssue,
  generateProgram,
  generateProgramFromIssue,
  getNextStep,
} from 'features/programs/services/programService';
import type { ProgramContext, StepAdvance } from 'features/programs/types';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Alert } from 'react-native';
import { ApiError } from 'lib/errors';
import React from 'react';

export default function HomeFlow() {
  const { currentScreen, goToHome, goToAnalysis, goToPractice, goToHistory } =
    useHomeFlowSequence();
  const router = useRouter();
  const navigation = useNavigation<DrawerNavigationProp<Record<string, undefined>>>();
  const { requirePremium } = useRequirePremium();
  const analysisController = useHomeAnalysisController();
  const [selectedIssue, setSelectedIssue] = React.useState<Issue | null>(null);
  const [selectedSession, setSelectedSession] = React.useState<PracticeSession | null>(null);
  const [programContext, setProgramContext] = React.useState<ProgramContext | null>(null);
  const [historyIssue, setHistoryIssue] = React.useState<Issue | null>(null);

  // WHICH AREA TAB IS OPEN, AND WHY IT LIVES HERE.
  // Each screen below is rendered conditionally, so HomeScreen unmounts the
  // moment the golfer starts a practice session. State held there dies with it,
  // and they would come back to the tab reset to the default — after every
  // single session, which is the most common journey in the app. This component
  // does not unmount, so the selection survives.
  const [selectedArea, setSelectedArea] = React.useState<string | null>(null);

  // LAND ON THE AREA THE GOLFER JUST ADDED A FOCUS TO.
  //
  // `exitToHome` dismisses back to this screen with `?area=` when the flow it
  // came from knew which part of the game the new focus belongs to (the library
  // and coach paths do; upload cannot, because one analysis can return issues
  // across several areas). Without this a golfer adds a putting focus, lands on
  // home, and is still looking at Full swing — which reads as the app forgetting
  // what they just did.
  const { area: areaParam } = useLocalSearchParams<{ area?: string }>();
  React.useEffect(() => {
    if (areaParam) setSelectedArea(areaParam);
  }, [areaParam]);

  // THE DRAWER IS ONLY REACHABLE FROM HOME.
  //
  // Practice, Analysis and History all render on THIS route — they are screens of
  // this flow, not routes of their own — so without this the edge-swipe stays live
  // during a live practice session, and a golfer reaching to scroll a drill gets
  // the "start a focus" panel over their session instead. The tab bar could never
  // do that: leaving practice took a deliberate tap.
  //
  // Gating the gesture rather than splitting the four screens into routes is the
  // cheap half of that fix. Splitting them would mean moving the state this file
  // owns (see `selectedArea` above), which is a much larger change for the same
  // protection.
  React.useEffect(() => {
    navigation.setOptions({ swipeEnabled: currentScreen === 'Home' });
  }, [navigation, currentScreen]);

  useFocusEffect(
    React.useCallback(() => {
      goToHome();
      setSelectedIssue(null);
      setSelectedSession(null);
      setProgramContext(null);
      setHistoryIssue(null);
      // selectedArea is deliberately NOT reset. Clearing it here would move
      // the bug rather than fix it: the tab would survive a practice session
      // and then die on the next tab switch.
      analysisController.refetch();
    }, [analysisController.refetch, goToHome])
  );

  const openHistory = React.useCallback(
    (issue: Issue) => {
      setHistoryIssue(issue);
      goToHistory();
    },
    [goToHistory]
  );

  // Start (or resume) the practice session for an issue. Creates the program on
  // demand along the path that matches the issue's source: AI issues keep their
  // analysis_issue_id provenance, coach and browse issues seed from issue_id.
  const startProgramSession = React.useCallback(
    async (issue: Issue) => {
      if (!issue.id) {
        Alert.alert(
          'Not in your plan',
          "This issue isn't active anymore — it was removed from your plan."
        );
        return;
      }
      if (!requirePremium()) return;

      try {
        let program = await getActiveProgramByIssue(issue.id);
        if (!program) {
          program = issue.analysis_issue_id
            ? await generateProgram(issue.analysis_issue_id)
            : await generateProgramFromIssue(issue.id);
        }

        const step = await getNextStep(program.id);
        if (!step) return;

        setSelectedIssue(issue);
        const session = await startPracticeSession({
          issueId: issue.id,
          analysisIssueId: issue.analysis_issue_id ?? null,
        });
        setSelectedSession(session);
        setProgramContext({
          programId: program.id,
          stepId: step.id,
          drillIds: step.prescription.drill_ids ?? [],
          // Captured before any block is logged. The completion screen diffs this against
          // the count StepAdvance returns to say what actually moved.
          groovedBefore: program.grooved_count,
        });
        goToPractice();
      } catch (error) {
        // A 409 means the golfer already holds two programs in this area.
        // The server names the area ("You're already working two putting
        // focuses…"), so show that rather than a message this screen made
        // up — the old hardcoded "you can only work one issue at a time"
        // stopped being true when the cap became two per area.
        if (error instanceof ApiError && error.status === 409) {
          Alert.alert(
            'That area is full',
            error.message || 'Finish one focus in this area before starting another.'
          );
        } else {
          console.error('Failed to start program session:', error);
          Alert.alert("Couldn't start that session", 'Please try again.');
        }
        setSelectedSession(null);
        setProgramContext(null);
      }
    },
    [requirePremium, goToPractice]
  );

  // Continue straight into the next session of the same focus, without going home.
  //
  // WHY THIS LIVES HERE AND NOT IN THE PRACTICE FLOW. Starting a session has two rules
  // attached that have nothing to do with practice: the premium gate, and the 409 the
  // server raises when the golfer already holds two programs in this area. Both are
  // already handled in startProgramSession above, and a second copy inside
  // features/practice is how the two would drift.
  //
  // Returns whether a new session actually started. The caller navigates only on true --
  // handing down a new session does NOT by itself move the screen, because
  // useScreenSequence keeps currentIndex in local state inside the flow.
  const continueProgramSession = React.useCallback(
    async (advance: StepAdvance): Promise<boolean> => {
      const issue = selectedIssue;
      const nextStep = advance.next_step;
      if (!issue?.id || !nextStep) return false;
      if (!requirePremium()) return false;

      try {
        const session = await startPracticeSession({
          issueId: issue.id,
          analysisIssueId: issue.analysis_issue_id ?? null,
        });
        setSelectedSession(session);
        setProgramContext({
          programId: advance.completed_step.program_id,
          stepId: nextStep.id,
          drillIds: nextStep.prescription.drill_ids ?? [],
          // The count after the step we just finished is the baseline for the next one.
          groovedBefore: advance.grooved_count,
        });
        return true;
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          Alert.alert(
            'That area is full',
            error.message || 'Finish one focus in this area before starting another.'
          );
        } else {
          console.error('Failed to continue program session:', error);
          Alert.alert("Couldn't start the next session", 'Please try again.');
        }
        return false;
      }
    },
    [selectedIssue, requirePremium]
  );

  return (
    <HomeAnalysisProvider value={analysisController}>
      <View style={{ flex: 1 }}>
        {currentScreen === 'Home' && (
          <HomeScreen
            selectedArea={selectedArea}
            onSelectArea={setSelectedArea}
            onOpenArchive={goToAnalysis}
            onOpenProfile={() => router.push('/profile')}
            onAddFocus={() => navigation.openDrawer()}
            onStartPractice={startProgramSession}
            onOpenHistory={openHistory}
          />
        )}
        {currentScreen === 'Analysis' && (
          <AnalysisResultScreen onBack={goToHome} onNext={startProgramSession} />
        )}
        {currentScreen === 'Practice' && (
          <PracticeFlow
            onBack={goToHome}
            selectedIssue={selectedIssue as Issue}
            selectedSession={selectedSession}
            programContext={programContext}
            onRequestContinue={continueProgramSession}
          />
        )}
        {currentScreen === 'History' && historyIssue && (
          <SwingHistoryScreen issue={historyIssue} onBack={goToHome} />
        )}
      </View>
    </HomeAnalysisProvider>
  );
}
