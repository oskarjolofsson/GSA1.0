import { useCallback } from "react";
import { useScreenSequence } from "features/shared/hooks/useScreenState";

type HomeScreen = "Home" | "Analysis" | "Practice" | "History";
const screens: HomeScreen[] = ["Home", "Analysis", "Practice", "History"];

export function useHomeFlowSequence() {
    const { currentScreen, goTo } = useScreenSequence<HomeScreen>({ screens });

    const goToHome = useCallback(() => goTo("Home"), [goTo]);
    const goToAnalysis = useCallback(() => goTo("Analysis"), [goTo]);
    const goToPractice = useCallback(() => goTo("Practice"), [goTo]);
    const goToHistory = useCallback(() => goTo("History"), [goTo]);

    return {
        currentScreen,
        goToHome,
        goToAnalysis,
        goToPractice,
        goToHistory,
    };
}
