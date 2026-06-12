import { useCallback } from "react";
import { useScreenSequence } from "features/shared/hooks/useScreenState";

type HomeScreen = "Analysis" | "Practice";
const screens: HomeScreen[] = ["Analysis", "Practice"];

export function useHomeFlowSequence() {
    const { currentScreen, goTo } = useScreenSequence<HomeScreen>({ screens });

    const goToAnalysis = useCallback(() => goTo("Analysis"), [goTo]);
    const goToPractice = useCallback(() => goTo("Practice"), [goTo]);

    return {
        currentScreen,
        goToAnalysis,
        goToPractice,
    };
}
