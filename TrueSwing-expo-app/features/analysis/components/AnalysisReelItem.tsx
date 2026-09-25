import { useEffect } from "react";
import { Dimensions, View } from "react-native";

import type { Analysis } from "features/analysis/types";
import useAnalysisData from "features/analysis/hooks/useAnalysisData";
import Reel from "features/analysis/components/Reel";
import IssueShowcaseOverlay from "features/analysis/components/IssueShowcaseOverlay";
import DetailedVideo from "features/analysis/components/DetailedVideo";

const { height } = Dimensions.get("window");

type AnalysisReelItemProps = {
    analysis: Analysis;
    isActive: boolean;
    isDrawingMode: boolean;
    onDrawingModeChange: (isDrawingMode: boolean) => void;
    activeIssueIndex: number;
    onActiveIssueChange: (index: number) => void;
};

export default function AnalysisReelItem({
    analysis,
    isActive,
    isDrawingMode,
    onDrawingModeChange,
    activeIssueIndex,
    onActiveIssueChange,
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
            />
        </View>
    );
}
