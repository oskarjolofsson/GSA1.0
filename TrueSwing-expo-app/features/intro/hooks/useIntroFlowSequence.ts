import { useCallback } from "react";
import { useScreenSequence } from "features/shared/hooks/useScreenState";

export type IntroScreen = "welcome" | "area" | "focus";

// Module scope, per features/CLAUDE.md: a new array literal each render
// destabilizes the `goTo` identity every transition below depends on.
const screens: IntroScreen[] = ["welcome", "area", "focus"];

/** Welcome -> pick an area -> pick one focus point in it. Named transitions, so
 *  the flow file never handles raw step strings. */
export function useIntroFlowSequence() {
    const { currentScreen, goTo } = useScreenSequence<IntroScreen>({ screens });

    const goToWelcome = useCallback(() => goTo("welcome"), [goTo]);
    const goToArea = useCallback(() => goTo("area"), [goTo]);
    const goToFocus = useCallback(() => goTo("focus"), [goTo]);

    return { currentScreen, goToWelcome, goToArea, goToFocus };
}
