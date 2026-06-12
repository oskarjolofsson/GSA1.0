import { useHomeFlowSequence } from "features/home/hooks/useHomeFlowSequence";
import AnalysisResultScreen from "features/analysis/screens/analysisResultScreen";
import PracticeFlow from "features/practice/practiceFlow";
import useHomeAnalysisController from "features/home/hooks/useHomeAnalysisController";
import { HomeAnalysisProvider } from "features/home/context/HomeAnalysisContext";
import type { Issue } from "features/issues/types";
import { startPracticeSession } from "features/practice/services/sessionService";
import type { PracticeSession } from "features/practice/types";

import { useFocusEffect } from '@react-navigation/native';
import { View } from "react-native";
import React from "react";


export default function HomeFlow() {
    const { currentScreen, goToAnalysis, goToPractice } = useHomeFlowSequence();
    const analysisController = useHomeAnalysisController();
    const [selectedIssue, setSelectedIssue] = React.useState<Issue | null>(null);
    const [selectedSession, setSelectedSession] = React.useState<PracticeSession | null>(null);

    useFocusEffect(
        React.useCallback(() => {
            goToAnalysis();
            setSelectedIssue(null);
            setSelectedSession(null);
            analysisController.refetch();
        }, [analysisController.refetch, goToAnalysis])
    )
    
    return (
        <HomeAnalysisProvider value={analysisController}>
            <View style={{ flex: 1 }}>
                {currentScreen === 'Analysis' && (
                    <AnalysisResultScreen
                        onNext={async (issue) => {
                            if (!issue.analysis_issue_id) return;

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