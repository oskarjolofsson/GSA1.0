import { useCallback } from "react";
import { useScreenSequence } from "features/shared/hooks/useScreenState";

type HomeScreen = "Home" | "Analysis" | "Practice";
const screens: HomeScreen[] = ["Home", "Analysis", "Practice"];

export function useHomeFlowSequence() {
    const { currentScreen, goTo } = useScreenSequence<HomeScreen>({ screens });

    const goToHome = useCallback(() => goTo("Home"), [goTo]);
    const goToAnalysis = useCallback(() => goTo("Analysis"), [goTo]);
    const goToPractice = useCallback(() => goTo("Practice"), [goTo]);

    return {
        currentScreen,
        goToHome,
        goToAnalysis,
        goToPractice,
    };
}
