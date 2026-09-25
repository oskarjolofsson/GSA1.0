import { useCallback } from "react";
import { useScreenSequence } from "features/shared/hooks/useScreenState";

type HomeScreen = "Home" | "Practice" | "History";
const screens: HomeScreen[] = ["Home", "Practice", "History"];

export function useHomeFlowSequence() {
    const { currentScreen, goTo } = useScreenSequence<HomeScreen>({ screens });

    const goToHome = useCallback(() => goTo("Home"), [goTo]);
    const goToPractice = useCallback(() => goTo("Practice"), [goTo]);
    const goToHistory = useCallback(() => goTo("History"), [goTo]);

    return {
        currentScreen,
        goToHome,
        goToPractice,
        goToHistory,
    };
}
