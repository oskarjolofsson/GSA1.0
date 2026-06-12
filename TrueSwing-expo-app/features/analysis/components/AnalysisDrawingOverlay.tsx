import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import type { DrawingPoint } from "features/analysis/hooks/useAnalysisDrawing";

type AnalysisDrawingOverlayProps = {
    strokes: DrawingPoint[][];
    activeStroke: DrawingPoint[];
    onStrokeStart: (point: DrawingPoint) => void;
    onStrokeMove: (point: DrawingPoint) => void;
    onStrokeEnd: () => void;
};

function pointsToPath(points: DrawingPoint[]) {
    if (!points.length) return "";

    if (points.length === 1) {
        const first = points[0];
        return `M ${first.x} ${first.y} L ${first.x + 0.1} ${first.y + 0.1}`;
    }

    const [first, ...rest] = points;
    return `M ${first.x} ${first.y} ${rest.map((point) => `L ${point.x} ${point.y}`).join(" ")}`;
}

export default function AnalysisDrawingOverlay({
    strokes,
    activeStroke,
    onStrokeStart,
    onStrokeMove,
    onStrokeEnd,
}: AnalysisDrawingOverlayProps) {
    const committedPaths = useMemo(
        () => strokes.map((stroke) => pointsToPath(stroke)).filter(Boolean),
        [strokes]
    );

    const activePath = useMemo(() => pointsToPath(activeStroke), [activeStroke]);

    return (
        <View
            style={StyleSheet.absoluteFill}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={(event) => {
                onStrokeStart({
                    x: event.nativeEvent.locationX,
                    y: event.nativeEvent.locationY,
                });
            }}
            onResponderMove={(event) => {
                onStrokeMove({
                    x: event.nativeEvent.locationX,
                    y: event.nativeEvent.locationY,
                });
            }}
            onResponderRelease={onStrokeEnd}
            onResponderTerminate={onStrokeEnd}
        >
            <Svg width="100%" height="100%">
                {committedPaths.map((pathData, index) => (
                    <Path
                        key={`${pathData}-${index}`}
                        d={pathData}
                        fill="none"
                        stroke="rgb(255, 255, 255)"
                        strokeWidth={4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                ))}
                {activePath ? (
                    <Path
                        d={activePath}
                        fill="none"
                        stroke="rgba(70, 235, 155, 0.95)"
                        strokeWidth={4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                ) : null}
            </Svg>
        </View>
    );
}
