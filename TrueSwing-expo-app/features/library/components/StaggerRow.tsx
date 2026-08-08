import type { ReactNode } from "react";
import { MotiView } from "moti";
import { useReducedMotion } from "react-native-reanimated";

import { LIBRARY_ANIM, ROW_EASING, rowDelay } from "../animations";

type Props = {
    /** Position in the list. Drives the stagger; clamped in `rowDelay`. */
    index: number;
    children: ReactNode;
};

/**
 * One list row's entrance, shared by every level of the library so the areas,
 * the fork and the candidates all arrive the same way.
 *
 * Honours the OS reduce-motion switch by rendering the final state immediately
 * rather than by shortening the animation -- a fast animation is still motion.
 */
export default function StaggerRow({ index, children }: Props) {
    const reduceMotion = useReducedMotion();

    return (
        <MotiView
            from={
                reduceMotion
                    ? { opacity: 1, translateY: 0 }
                    : { opacity: 0, translateY: LIBRARY_ANIM.rowRise }
            }
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
                type: "timing",
                duration: reduceMotion ? 0 : LIBRARY_ANIM.rowDuration,
                delay: reduceMotion ? 0 : rowDelay(index),
                easing: ROW_EASING,
            }}
        >
            {children}
        </MotiView>
    );
}
