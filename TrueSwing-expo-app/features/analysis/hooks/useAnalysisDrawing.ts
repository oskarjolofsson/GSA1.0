import { useCallback, useMemo, useState } from "react";

export type DrawingPoint = {
    x: number;
    y: number;
};

const MIN_POINT_DISTANCE = 2;

function distanceBetween(a: DrawingPoint, b: DrawingPoint) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

export default function useAnalysisDrawing() {
    const [strokes, setStrokes] = useState<DrawingPoint[][]>([]);
    const [activeStroke, setActiveStroke] = useState<DrawingPoint[]>([]);

    const beginStroke = useCallback((point: DrawingPoint) => {
        setActiveStroke([point]);
    }, []);

    const extendStroke = useCallback((point: DrawingPoint) => {
        setActiveStroke((current) => {
            if (!current.length) {
                return [point];
            }

            const lastPoint = current[current.length - 1];
            if (distanceBetween(lastPoint, point) < MIN_POINT_DISTANCE) {
                return current;
            }

            return [...current, point];
        });
    }, []);

    const commitStroke = useCallback(() => {
        setActiveStroke((current) => {
            if (current.length < 2) {
                return [];
            }

            setStrokes((existing) => [...existing, current]);
            return [];
        });
    }, []);

    const undoLastStroke = useCallback(() => {
        setStrokes((existing) => {
            if (!existing.length) return existing;
            return existing.slice(0, -1);
        });
    }, []);

    const clearAllStrokes = useCallback(() => {
        setStrokes([]);
        setActiveStroke([]);
    }, []);

    const hasStrokes = useMemo(
        () => strokes.length > 0 || activeStroke.length > 0,
        [strokes.length, activeStroke.length]
    );

    return {
        strokes,
        activeStroke,
        hasStrokes,
        beginStroke,
        extendStroke,
        commitStroke,
        undoLastStroke,
        clearAllStrokes,
    };
}
