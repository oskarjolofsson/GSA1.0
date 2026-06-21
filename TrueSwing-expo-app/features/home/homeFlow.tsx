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

import { useFocusEffect } from '@react-navigation/native';
import { View } from "react-native";
import React from "react";


export default function HomeFlow() {
    const { currentScreen, goToHome, goToAnalysis, goToPractice } = useHomeFlowSequence();
    const { requirePremium } = useRequirePremium();
    const analysisController = useHomeAnalysisController();
    const [selectedIssue, setSelectedIssue] = React.useState<Issue | null>(null);
    const [selectedSession, setSelectedSession] = React.useState<PracticeSession | null>(null);

    useFocusEffect(
        React.useCallback(() => {
            goToHome();
            setSelectedIssue(null);
            setSelectedSession(null);
            analysisController.refetch();
        }, [analysisController.refetch, goToHome])
    )

    return (
        <HomeAnalysisProvider value={analysisController}>
            <View style={{ flex: 1 }}>
                {currentScreen === 'Home' && (
                    <HomeScreen
                        onOpenArchive={goToAnalysis}
                        onStartPrescription={goToHome}
                    />
                )}
                {currentScreen === 'Analysis' && (
                    <AnalysisResultScreen
                        onBack={goToHome}
                        onNext={async (issue) => {
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
                        }}
                    />
                )}
                {currentScreen === 'Practice' && (
                    <PracticeFlow
                        onBack={goToAnalysis}
                        selectedIssue={selectedIssue as Issue}
                        selectedSession={selectedSession}
                    />
                )}
            </View>
        </HomeAnalysisProvider>
    )
}