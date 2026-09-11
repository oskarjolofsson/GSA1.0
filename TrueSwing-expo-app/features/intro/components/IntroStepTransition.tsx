import type { ReactNode } from "react";
import { AnimatePresence, MotiView } from "moti";
import { useReducedMotion } from "react-native-reanimated";

import { INTRO_ANIM } from "../animations";

type Props = {
    /** Unique per step, so `AnimatePresence` treats a step change as an
     *  exit-then-enter rather than a re-render of the same element. */
    screenKey: string;
    /** 1 moving forward through the sequence, -1 moving back. */
    direction: 1 | -1;
    children: ReactNode;
};

/** Slides the intro's current step in from the direction it was reached, and
 *  the previous one out the opposite way — one wrapper so every step arrives
 *  the same way without each screen file owning its own animation. */
export default function IntroStepTransition({ screenKey, direction, children }: Props) {
    const reduceMotion = useReducedMotion();
    const travel = reduceMotion ? 0 : INTRO_ANIM.stepTravel;

    return (
        <AnimatePresence exitBeforeEnter>
            <MotiView
                key={screenKey}
                from={{ opacity: 0, translateX: travel * direction }}
                animate={{ opacity: 1, translateX: 0 }}
                exit={{ opacity: 0, translateX: -travel * direction }}
                transition={{ type: "timing", duration: reduceMotion ? 0 : INTRO_ANIM.stepDuration }}
                style={{ flex: 1 }}
            >
                {children}
            </MotiView>
        </AnimatePresence>
    );
}
