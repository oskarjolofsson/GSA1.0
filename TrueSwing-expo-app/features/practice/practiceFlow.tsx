import { View } from "react-native";
import { useHomeAnalysis } from "features/home/context/HomeAnalysisContext";
import type { Issue } from "features/issues/types";
import ErrorState from "features/shared/components/ErrorState";
import DrillPracticeScreen from "./screens/drillPracticeScreen";
import DrillResultScreen from "./screens/drillResultScreen";
import { usePracticeFlowSequence } from "./hooks/usePracticeFlowSequence";
import type { PracticeSession } from "./types";
import type { ProgramContext } from "features/programs/types";


type PracticeFlowProps = {
    onBack: () => void;
    selectedIssue: Issue;
    selectedSession: PracticeSession | null;
    programContext?: ProgramContext | null;
};

export default function PracticeFlow({ onBack, selectedIssue, selectedSession, programContext }: PracticeFlowProps) {
    const { currentScreen, goToResult } = usePracticeFlowSequence();
    useHomeAnalysis();

    console.log(selectedIssue)

    // Any issue with an id is practiceable now (AI, coach, or browse). A custom
    // issue has no analysis_issue_id and that's fine — the program drives practice.
    if (!selectedIssue.id) return <ErrorState title="No issue selected for practice" buttonText={"Go back"} onRetry={onBack} />;
    if(!selectedSession) return <ErrorState title="No active session found for this practice run" buttonText={"Go back"} onRetry={onBack} />;

    return (
        <View style={{ flex: 1 }}>
            {currentScreen === 'Practice' && (
                <DrillPracticeScreen
                    issue={selectedIssue}
                    session={selectedSession}
                    onNext={goToResult}
                    onBack={() => {}}
                    programContext={programContext}
                />
            )}
            {currentScreen === 'Result' && (
                <DrillResultScreen session={selectedSession} onNext={() => {}} onBack={onBack} />
            )}
        </View>
    );
}
