import { useCallback } from "react";
import { useScreenSequence } from "features/shared/hooks/useScreenState";

export type IntroScreen = "welcome" | "area" | "goal" | "branch" | "focus";

// Module scope, per features/CLAUDE.md: a new array literal each render
// destabilizes the `goTo` identity every transition below depends on.
const screens: IntroScreen[] = ["welcome", "area", "goal", "branch", "focus"];

/** Welcome -> pick an area -> pick a goal ("get better" or "fix an issue") ->
 *  pick the miss/goal branch that narrows it -> pick one focus point. Named
 *  transitions, so the flow file never handles raw step strings. */
export function useIntroFlowSequence() {
    const { currentScreen, goTo } = useScreenSequence<IntroScreen>({ screens });

    const goToWelcome = useCallback(() => goTo("welcome"), [goTo]);
    const goToArea = useCallback(() => goTo("area"), [goTo]);
    const goToGoal = useCallback(() => goTo("goal"), [goTo]);
    const goToBranch = useCallback(() => goTo("branch"), [goTo]);
    const goToFocus = useCallback(() => goTo("focus"), [goTo]);

    return { currentScreen, goToWelcome, goToArea, goToGoal, goToBranch, goToFocus };
}
