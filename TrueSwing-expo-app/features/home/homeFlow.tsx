import { useHomeFlowSequence } from "features/home/hooks/useHomeFlowSequence";
import HomeScreen from "features/home/screens/HomeScreen";
import AnalysisResultScreen from "features/analysis/screens/analysisResultScreen";
import PracticeFlow from "features/practice/practiceFlow";
import SwingHistoryScreen from "features/progress/screens/SwingHistoryScreen";
import useHomeAnalysisController from "features/home/hooks/useHomeAnalysisController";
import { HomeAnalysisProvider } from "features/home/context/HomeAnalysisContext";
import type { Issue } from "features/issues/types";
import { startPracticeSession, endPracticeSession } from "features/practice/services/sessionService";
import type { PracticeSession } from "features/practice/types";
import { useRequirePremium } from "features/billing/hooks/useRequirePremium";
import { getActiveProgramByIssue, generateProgram, generateProgramFromIssue, getNextStep, completeStep } from "features/programs/services/programService";
import { clearRetestIntent } from "features/programs/retestIntent";
import type { ProgramContext } from "features/programs/types";
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import { View, Alert } from "react-native";
import { ApiError } from "lib/errors";
import React from "react";

export type LogSessionArgs = {
    analysisIssueId: string | null;  // null for custom (coach/browse) issues
    programId: string;
    stepId: string;
    sessionType: "play" | "retest";
    notes: string;
};

export type SkipStepArgs = {
    programId: string;
    stepId: string;
};


export default function HomeFlow() {
    const { currentScreen, goToHome, goToAnalysis, goToPractice, goToHistory } = useHomeFlowSequence();
    const router = useRouter();
    const { requirePremium } = useRequirePremium();
    const analysisController = useHomeAnalysisController();
    const [selectedIssue, setSelectedIssue] = React.useState<Issue | null>(null);
    const [selectedSession, setSelectedSession] = React.useState<PracticeSession | null>(null);
    const [programContext, setProgramContext] = React.useState<ProgramContext | null>(null);
    const [historyIssue, setHistoryIssue] = React.useState<Issue | null>(null);

    useFocusEffect(
        React.useCallback(() => {
            goToHome();
            setSelectedIssue(null);
            setSelectedSession(null);
            setProgramContext(null);
            setHistoryIssue(null);
            // Bailing back to home discards an unconsumed re-test intent.
            clearRetestIntent();
            analysisController.refetch();
        }, [analysisController.refetch, goToHome])
    )

    const openHistory = React.useCallback((issue: Issue) => {
        setHistoryIssue(issue);
        goToHistory();
    }, [goToHistory]);

    // Program-driven start, used by the home card AND the analysis reel. Lazily
    // creates the program, then launches the next range session. Gives feedback
    // (rather than a silent no-op) for issues that can't be practiced.
    const startProgramSession = React.useCallback(async (issue: Issue) => {
        if (!issue.id) {
            Alert.alert("Not in your plan", "This issue isn't active anymore — it was removed from your plan.");
            return;
        }
        if (!requirePremium()) return;

        try {
            // Look up by issue_id (works for every source). Generate along the path
            // that matches the source: AI issues keep analysis_issue_id provenance;
            // custom (coach/browse) issues seed straight from issue_id.
            let program = await getActiveProgramByIssue(issue.id);
            if (!program) {
                program = issue.analysis_issue_id
                    ? await generateProgram(issue.analysis_issue_id)
                    : await generateProgramFromIssue(issue.id);
            }

            const step = await getNextStep(program.id);
            if (!step) return;
            if (step.session_type !== "range") {
                const what = step.session_type === "play" ? "to play a round" : "a re-test";
                Alert.alert("Open it from home", `Your next session for this issue is ${what}. Head to your home plan to do it.`);
                return;
            }

            setSelectedIssue(issue);
            const session = await startPracticeSession(issue.analysis_issue_id ?? null);
            setSelectedSession(session);
            setProgramContext({
                programId: program.id,
                stepId: step.id,
                drillIds: step.prescription.drill_ids ?? [],
            });
            goToPractice();
        } catch (error) {
            // One active program at a time: the backend blocks a second focus.
            if (error instanceof ApiError && error.status === 409) {
                Alert.alert("Finish your current focus first", "You can only work one issue's plan at a time.");
            } else {
                console.error("Failed to start program session:", error);
            }
            setSelectedSession(null);
            setProgramContext(null);
        }
    }, [requirePremium, goToPractice]);

    // Log a no-activity program session (play round or re-test): create a completed
    // session of the given type (earns the streak square), then advance the program.
    // Returns success so the caller can close the modal + refetch (and, for retest,
    // route to the upload tab).
    const logProgramSession = React.useCallback(async ({ analysisIssueId, programId, stepId, sessionType, notes }: LogSessionArgs) => {
        if (!requirePremium()) return false;
        try {
            const session = await startPracticeSession(analysisIssueId, {
                session_type: sessionType,
                notes: notes || null,
            });
            await endPracticeSession(session.id);
            await completeStep(programId, stepId, { practice_session_id: session.id });
            return true;
        } catch (error) {
            console.error("Failed to log program session:", error);
            return false;
        }
    }, [requirePremium]);

    // Deliberately skip a step (e.g. a re-test) without doing it: advance the
    // program, no session, no streak square.
    const skipStep = React.useCallback(async ({ programId, stepId }: SkipStepArgs) => {
        try {
            await completeStep(programId, stepId, {});
            return true;
        } catch (error) {
            console.error("Failed to skip step:", error);
            return false;
        }
    }, []);

    return (
        <HomeAnalysisProvider value={analysisController}>
            <View style={{ flex: 1 }}>
                {currentScreen === 'Home' && (
                    <HomeScreen
                        onOpenArchive={goToAnalysis}
                        onOpenProfile={() => router.push("/(tabs)/profile")}
                        onStartPractice={startProgramSession}
                        onLogSession={logProgramSession}
                        onSkipStep={skipStep}
                        onOpenHistory={openHistory}
                    />
                )}
                {currentScreen === 'Analysis' && (
                    <AnalysisResultScreen
                        onBack={goToHome}
                        onNext={startProgramSession}
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
                {currentScreen === 'History' && historyIssue && (
                    <SwingHistoryScreen issue={historyIssue} onBack={goToHome} />
                )}
            </View>
        </HomeAnalysisProvider>
    )
}