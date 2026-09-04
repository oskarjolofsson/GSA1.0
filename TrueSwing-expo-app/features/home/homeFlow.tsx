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

  // Which area tab is open. Held here rather than in HomeScreen, which unmounts during a
  // practice session. See ADR-0023.
  const [selectedArea, setSelectedArea] = React.useState<string | null>(null);

  // Land on the area the golfer just added a focus to; `exitToHome` passes `?area=` when
  // the originating flow knew it. See ADR-0023.
  const { area: areaParam } = useLocalSearchParams<{ area?: string }>();
  React.useEffect(() => {
    if (areaParam) setSelectedArea(areaParam);
  }, [areaParam]);

  // The drawer's edge-swipe is only live on Home: practice renders on this same route, so
  // an ungated gesture fires mid-session. See ADR-0023.
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
      // selectedArea is deliberately NOT reset here. See ADR-0023.
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

  // Start (or resume) the practice session for an issue, creating the program on demand
  // along the path that matches the issue's source: AI issues keep their analysis_issue_id
  // provenance, coach and browse issues seed from issue_id.
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
          // Captured before any block is logged; the completion screen diffs it against the
          // count StepAdvance returns.
          groovedBefore: program.grooved_count,
        });
        goToPractice();
      } catch (error) {
        // A 409 means this area is full. Prefer the server's message: it names the area,
        // and the cap is server-side content this screen should not restate.
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
  // Returns whether a session actually started; the caller navigates only on true. Lives
  // here rather than in the practice flow -- see ADR-0023.
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
