import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "react-native-reanimated";

/**
 * Animate an integer from 0 up to `target` over `duration` ms using
 * requestAnimationFrame. Respects the OS "reduce motion" setting (jumps
 * straight to the target). Re-runs when `target` changes; cancels its frame
 * loop on unmount so it never sets state after teardown.
 */
export default function useCountUp(target: number, duration = 700, delay = 0): number {
    const reduceMotion = useReducedMotion();
    const [value, setValue] = useState(0);
    const rafRef = useRef<number | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (reduceMotion || duration <= 0) {
            setValue(target);
            return;
        }

        let start: number | null = null;

        const tick = (now: number) => {
            if (start === null) start = now;
            const progress = Math.min((now - start) / duration, 1);
            // Ease-out so it decelerates into the final number.
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(tick);
            }
        };

        setValue(0);
        timeoutRef.current = setTimeout(() => {
            rafRef.current = requestAnimationFrame(tick);
        }, delay);

        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
            if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
        };
    }, [target, duration, delay, reduceMotion]);

    return value;
}
