import type { ReactNode } from "react";
import { Dimensions } from "react-native";
import { AnimatePresence, MotiView } from "moti";
import { useReducedMotion } from "react-native-reanimated";

import { INTRO_ANIM } from "../animations";

type Props = {
    /** Unique per step, so `AnimatePresence` treats a step change as a new
     *  element sliding in over the outgoing one, not a re-render. */
    screenKey: string;
    /** 1 moving forward through the sequence, -1 moving back. */
    direction: 1 | -1;
    /** "push" (default) for every step-to-step move. "fade" only for
     *  welcome<->area: the welcome screen carries its own separate, fully
     *  opaque hero image (not the shared static background the picking steps
     *  sit on top of), so a fade there never risks the darkening-lift bug a
     *  push was built to avoid — it's just the one transition that's safe to
     *  make fade, and was asked for by name. */
    variant?: "push" | "fade";
    children: ReactNode;
};

const SCREEN_WIDTH = Dimensions.get("window").width;

/**
 * A native-style push: the incoming step slides fully across as the outgoing
 * one slides fully off, both mounted at once, translateX only — no opacity.
 *
 * Not `exitBeforeEnter` + fade, which is what this replaced for every step.
 * That pattern fully unmounts the outgoing screen before mounting the
 * incoming one, and animates opacity to do it — and opacity on a screen
 * means opacity on ITS dark photo overlay too, so for a frame the darkening
 * genuinely lifted (nothing is see-through by design; the animation was
 * making it so). A position-only push never touches alpha: at every instant
 * of the animation something fully opaque covers the whole frame. */
export default function IntroStepTransition({ screenKey, direction, variant = "push", children }: Props) {
    const reduceMotion = useReducedMotion();
    const travel = reduceMotion || variant === "fade" ? 0 : SCREEN_WIDTH;

    return (
        <AnimatePresence>
            <MotiView
                key={screenKey}
                from={{ opacity: variant === "fade" ? 0 : 1, translateX: travel * direction }}
                animate={{ opacity: 1, translateX: 0 }}
                exit={{ opacity: variant === "fade" ? 0 : 1, translateX: -travel * direction }}
                transition={{ type: "timing", duration: reduceMotion ? 0 : INTRO_ANIM.stepDuration }}
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            >
                {children}
            </MotiView>
        </AnimatePresence>
    );
}
