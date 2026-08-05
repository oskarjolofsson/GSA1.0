import { useHomeFlowSequence } from 'features/home/hooks/useHomeFlowSequence';
import HomeScreen from 'features/home/screens/HomeScreen';
import AnalysisResultScreen from 'features/analysis/screens/AnalysisResultScreen';
import PracticeFlow from 'features/practice/practiceFlow';
import SwingHistoryScreen from 'features/progress/screens/SwingHistoryScreen';
import useHomeAnalysisController from 'features/home/hooks/useHomeAnalysisController';
import { HomeAnalysisProvider } from 'features/home/context/HomeAnalysisContext';
import type { Issue } from 'features/issues/types';
import {
  startPracticeSession,
  endPracticeSession,
} from 'features/practice/services/sessionService';
import type { PracticeSession } from 'features/practice/types';
import { useRequirePremium } from 'features/billing/hooks/useRequirePremium';
import {
  getActiveProgramByIssue,
  generateProgram,
  generateProgramFromIssue,
  getNextStep,
} from 'features/programs/services/programService';
import type { ProgramContext } from 'features/programs/types';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { View, Alert } from 'react-native';
import { ApiError } from 'lib/errors';
import React from 'react';

export default function HomeFlow() {
  const { currentScreen, goToHome, goToAnalysis, goToPractice, goToHistory } =
    useHomeFlowSequence();
  const router = useRouter();
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

  // Log a round the golfer played away from the app.
  //
  // NOT tied to a program, and it completes no step. A round used to be a step
  // inside one program, which meant someone carrying three focuses was prompted
  // to go and play three times for the same round. Playing serves every open
  // focus at once, so it is now a plain practice session with session_type
  // 'play' and no issue: `area` is left null, which the backend records as
  // unattributed and the contribution graph renders as its own segment.
  const logRound = React.useCallback(
    async (notes: string) => {
      if (!requirePremium()) return false;
      try {
        const session = await startPracticeSession({
          issueId: null,
          analysisIssueId: null,
          sessionType: 'play',
          notes: notes || null,
        });
        await endPracticeSession(session.id);
        return true;
      } catch (error) {
        console.error('Failed to log round:', error);
        Alert.alert("Couldn't log that round", 'Please try again.');
        return false;
      }
    },
    [requirePremium]
  );

  return (
    <HomeAnalysisProvider value={analysisController}>
      <View style={{ flex: 1 }}>
        {currentScreen === 'Home' && (
          <HomeScreen
            selectedArea={selectedArea}
            onSelectArea={setSelectedArea}
            onOpenArchive={goToAnalysis}
            onOpenProfile={() => router.push('/(tabs)/profile')}
            onStartPractice={startProgramSession}
            onLogRound={logRound}
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
          />
        )}
        {currentScreen === 'History' && historyIssue && (
          <SwingHistoryScreen issue={historyIssue} onBack={goToHome} />
        )}
      </View>
    </HomeAnalysisProvider>
  );
}
