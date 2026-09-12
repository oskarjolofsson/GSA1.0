import type { ReactNode } from "react";
import { Dimensions } from "react-native";
import { AnimatePresence, MotiView } from "moti";
import { useReducedMotion } from "react-native-reanimated";

const STEP_DURATION_MS = 150;

type Props = {
    /** Unique per step, so `AnimatePresence` treats a step change as a new
     *  element sliding in over the outgoing one, not a re-render. */
    screenKey: string;
    /** 1 moving forward through the sequence, -1 moving back. */
    direction: 1 | -1;
    /** "push" (default) for a step-to-step move. "fade" for a move that isn't
     *  really a step in the sequence — e.g. intro's welcome<->area (welcome
     *  carries its own separate hero, not the shared background the picking
     *  steps sit on), or the library's search overlay (orthogonal to the
     *  area/focus/candidates hierarchy, not a move within it). */
    variant?: "push" | "fade";
    children: ReactNode;
};

const SCREEN_WIDTH = Dimensions.get("window").width;

/**
 * A native-style push: the incoming step slides fully across as the outgoing
 * one slides fully off, both mounted at once, translateX only — no opacity.
 *
 * Not `exitBeforeEnter` + fade. That pattern fully unmounts the outgoing
 * screen before mounting the incoming one, animating opacity to do it — and
 * opacity on a screen with its own dark overlay means opacity on the
 * darkening too, so for a frame the darkening visibly lifts. A position-only
 * push never touches alpha: at every instant something fully opaque covers
 * the whole frame.
 */
export default function StepTransition({ screenKey, direction, variant = "push", children }: Props) {
    const reduceMotion = useReducedMotion();
    const travel = reduceMotion || variant === "fade" ? 0 : SCREEN_WIDTH;

    return (
        <AnimatePresence>
            <MotiView
                key={screenKey}
                from={{ opacity: variant === "fade" ? 0 : 1, translateX: travel * direction }}
                animate={{ opacity: 1, translateX: 0 }}
                exit={{ opacity: variant === "fade" ? 0 : 1, translateX: -travel * direction }}
                transition={{ type: "timing", duration: reduceMotion ? 0 : STEP_DURATION_MS }}
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            >
                {children}
            </MotiView>
        </AnimatePresence>
    );
}
