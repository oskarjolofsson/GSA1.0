import { useHomeFlowSequence } from "features/home/hooks/useHomeFlowSequence";
import HomeScreen from "features/home/screens/HomeScreen";
import AnalysisResultScreen from "features/analysis/screens/analysisResultScreen";
import PracticeFlow from "features/practice/practiceFlow";
import useHomeAnalysisController from "features/home/hooks/useHomeAnalysisController";
import { HomeAnalysisProvider } from "features/home/context/HomeAnalysisContext";
import type { Issue } from "features/issues/types";
import { startPracticeSession } from "features/practice/services/sessionService";
import type { PracticeSession } from "features/practice/types";
import { useRequirePremium } from "features/billing/hooks/useRequirePremium";
import { getActiveProgram, generateProgram, getNextStep } from "features/programs/services/programService";
import type { ProgramContext } from "features/programs/types";

import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import { View } from "react-native";
import React from "react";


export default function HomeFlow() {
    const { currentScreen, goToHome, goToAnalysis, goToPractice } = useHomeFlowSequence();
    const router = useRouter();
    const { requirePremium } = useRequirePremium();
    const analysisController = useHomeAnalysisController();
    const [selectedIssue, setSelectedIssue] = React.useState<Issue | null>(null);
    const [selectedSession, setSelectedSession] = React.useState<PracticeSession | null>(null);
    const [programContext, setProgramContext] = React.useState<ProgramContext | null>(null);

    useFocusEffect(
        React.useCallback(() => {
            goToHome();
            setSelectedIssue(null);
            setSelectedSession(null);
            setProgramContext(null);
            analysisController.refetch();
        }, [analysisController.refetch, goToHome])
    )

    // Shared practice-start: used by both the reel (onNext) and the home
    // prescription card. Gates on premium, creates a session, then navigates.
    const startPracticeForIssue = React.useCallback(async (issue: Issue) => {
        if (!issue.analysis_issue_id) return;

        // Drills are premium — gate before starting a session.
        if (!requirePremium()) return;

        try {
            setSelectedIssue(issue);
            const session = await startPracticeSession(issue.analysis_issue_id);
            setSelectedSession(session);
            goToPractice();
        } catch (error) {
            console.error('Failed to start practice session before navigation:', error);
            setSelectedSession(null);
        }
    }, [requirePremium, goToPractice]);

    // Program-driven start (home card). Lazily creates the program on first use,
    // then launches the next session. Range only this phase: play/retest aren't
    // startable yet, so we no-op (the card disables Start for those).
    const startProgramSession = React.useCallback(async (issue: Issue) => {
        if (!issue.analysis_issue_id) return;
        if (!requirePremium()) return;

        try {
            let program = await getActiveProgram(issue.analysis_issue_id);
            if (!program) program = await generateProgram(issue.analysis_issue_id);

            const step = await getNextStep(program.id);
            if (!step || step.session_type !== "range") return;

            setSelectedIssue(issue);
            const session = await startPracticeSession(issue.analysis_issue_id);
            setSelectedSession(session);
            setProgramContext({
                programId: program.id,
                stepId: step.id,
                drillIds: step.prescription.drill_ids ?? [],
            });
            goToPractice();
        } catch (error) {
            console.error("Failed to start program session:", error);
            setSelectedSession(null);
            setProgramContext(null);
        }
    }, [requirePremium, goToPractice]);

    return (
        <HomeAnalysisProvider value={analysisController}>
            <View style={{ flex: 1 }}>
                {currentScreen === 'Home' && (
                    <HomeScreen
                        onOpenArchive={goToAnalysis}
                        onOpenProfile={() => router.push("/(tabs)/profile")}
                        onStartPractice={startProgramSession}
                    />
                )}
                {currentScreen === 'Analysis' && (
                    <AnalysisResultScreen
                        onBack={goToHome}
                        onNext={startPracticeForIssue}
                    />
                )}
                {currentScreen === 'Practice' && (
                    <PracticeFlow
                        onBack={goToHome}
                        selectedIssue={selectedIssue as Issue}
                        selectedSession={selectedSession}
                        programContext={programContext}
                    />
                )}
            </View>
        </HomeAnalysisProvider>
    )
}