import { useCallback, useEffect } from "react";
import { Dimensions, Pressable, StyleSheet, View, Text } from "react-native";

import type { Analysis } from "features/analysis/types";
import useAnalysisData from "features/analysis/hooks/useAnalysisData";
import Reel from "features/analysis/components/Reel";
import IssueShowcaseOverlay from "features/analysis/components/IssueShowcaseOverlay";
import { Issue } from "features/issues/types";
import { Ruler, ArrowBigDown, ArrowBigUp } from "lucide-react-native";
import DetailedVideo from "features/analysis/components/DetailedVideo";

const { height } = Dimensions.get("window");

type AnalysisReelItemProps = {
    analysis: Analysis;
    isActive: boolean;
    isDrawingMode: boolean;
    onDrawingModeChange: (isDrawingMode: boolean) => void;
    activeIssueIndex: number;
    onActiveIssueChange: (index: number) => void;
    startPractice: (activeIssue: Issue) => void;
};

export default function AnalysisReelItem({
    analysis,
    isActive,
    isDrawingMode,
    onDrawingModeChange,
    activeIssueIndex,
    onActiveIssueChange,
    startPractice,
}: AnalysisReelItemProps) {
    const { videoURL, issues } = useAnalysisData(analysis);

    useEffect(() => {
        if (!issues.length && activeIssueIndex !== 0) {
            onActiveIssueChange(0);
            return;
        }

        if (issues.length && activeIssueIndex > issues.length - 1) {
            onActiveIssueChange(issues.length - 1);
        }
    }, [activeIssueIndex, issues.length, onActiveIssueChange]);

    const openDrawingMode = useCallback(() => {
        onDrawingModeChange(true);
    }, [onDrawingModeChange]);


    if (isDrawingMode) {
        return (
            <DetailedVideo
                analysis={analysis}
                videoURL={videoURL ?? null}
                isActive={isActive}
                onExit={() => onDrawingModeChange(false)}
            />
        );
    }

    return (
        <View style={{ height }} className="bg-black">
            <Reel
                video_url={videoURL ?? null}
                thumbnail_url={analysis.thumbnail_url}
                shouldPlay={isActive}
            />
            <IssueShowcaseOverlay
                issues={issues}
                activeIssueIndex={activeIssueIndex}
                onActiveIssueChange={onActiveIssueChange}
                startPractice={startPractice}
            />

            <View
                pointerEvents="box-none"
                style={StyleSheet.absoluteFill}
            >
                <Pressable
                    onPress={openDrawingMode}
                    className="absolute h-12 w-12 rounded-full border-2 border-white/50"
                    style={{
                        left: 16,
                        top: "35%",
                        marginTop: -24,
                        zIndex: 999,
                        elevation: 999,
                    }}
                >
                    {({ pressed }) => (
                        <View
                            className="flex-1 items-center justify-center rounded-full border border-white/10"
                            style={{
                                backgroundColor: pressed
                                    ? "rgba(0,0,0,0.8)"
                                    : "rgba(0,0,0,0.6)",
                                transform: [{ scale: pressed ? 0.95 : 1 }],
                            }}
                        >
                            <Ruler size={20} color="white" />
                        </View>
                    )}
                </Pressable>
            </View>

            {/* <View
                pointerEvents="box-none"
                style={StyleSheet.absoluteFill}
            >
                <Pressable
                    onPress={() => {}}
                    className="absolute h-16 w-16 rounded-full border-2 border-white/10"
                    style={{
                        right: 16,
                        top: "85%",
                        marginTop: -24,
                        zIndex: 999,
                        elevation: 999,
                    }}
                >
                    {({ pressed }) => (
                        <View
                            className="flex-1 items-center justify-center rounded-full border border-white/10"
                            style={{backgroundColor: "rgba(0,0,0,0.2)"}}
                        >
                            <ArrowBigDown size={22} color="white" />
                            <Text className="text-xs text-white/80 -mt-1">Swipe</Text>
                        </View>
                    )}
                </Pressable>
            </View> */}

            

        </View>
    );
}
