import { useCallback } from "react";
import { useScreenSequence } from "features/shared/hooks/useScreenState";

type PracticeScreen = "Practice" | "Result";
const screens: PracticeScreen[] = ["Practice", "Result"];

export function usePracticeFlowSequence() {
    const { currentScreen, goTo } = useScreenSequence<PracticeScreen>({ screens });

    const goToResult = useCallback(() => goTo("Result"), [goTo]);
    const goToPractice = useCallback(() => goTo("Practice"), [goTo]);

    return {
        currentScreen,
        goToResult,
        goToPractice,
    };
}
