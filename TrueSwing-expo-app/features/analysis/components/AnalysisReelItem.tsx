import { useEffect, useRef, useState } from "react";
import { Dimensions, View } from "react-native";

import type { Analysis } from "features/analysis/types";
import useAnalysisData from "features/analysis/hooks/useAnalysisData";
import useReelPlayback from "features/analysis/hooks/useReelPlayback";
import useScrubFriendlyVideo from "features/analysis/hooks/useScrubFriendlyVideo";
import ReelVideoSurface from "features/analysis/components/ReelVideoSurface";
import ReelPlaybackChrome from "features/analysis/components/ReelPlaybackChrome";
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
    /** Leaves the reel entirely — the drawing overlay's back chevron uses it. */
    onBack?: () => void;
};

/**
 * One full-screen swing in the reel. It owns the player and the video surface, and the
 * two modes are overlays on top: swapping them never tears the video down, so entering
 * or leaving drawing mode keeps the frame and the playhead exactly where they were.
 */
export default function AnalysisReelItem({
    analysis,
    isActive,
    isDrawingMode,
    onDrawingModeChange,
    activeIssueIndex,
    onActiveIssueChange,
    onBack,
}: AnalysisReelItemProps) {
    const { videoURL, issues } = useAnalysisData(analysis);

    // Sticky: once the scrub-friendly copy has been prepared for this swing, stay on it.
    // Flipping the source back on exit would reload the player — the very hitch the
    // shared surface exists to avoid.
    const [needsScrubFriendlyVideo, setNeedsScrubFriendlyVideo] = useState(isDrawingMode);
    useEffect(() => {
        if (isDrawingMode) setNeedsScrubFriendlyVideo(true);
    }, [isDrawingMode]);

    const { uri: playableUri, status: prepStatus } = useScrubFriendlyVideo(
        analysis.analysis_id,
        videoURL ?? null,
        needsScrubFriendlyVideo,
    );
    const isPreparing = prepStatus === "preparing";

    const playback = useReelPlayback({
        source: playableUri,
        shouldPlay: isActive && !isPreparing,
        muted: true,
        loop: false,
    });

    // Switching between the feed and drawing mode plays the swing from the top again —
    // the same start the old mount-a-new-player switch gave, minus the reload.
    const restartRef = useRef(playback.restart);
    useEffect(() => {
        restartRef.current = playback.restart;
    }, [playback.restart]);

    const isFirstModeRef = useRef(true);
    useEffect(() => {
        if (isFirstModeRef.current) {
            isFirstModeRef.current = false;
            return;
        }
        restartRef.current();
    }, [isDrawingMode]);

    useEffect(() => {
        if (!issues.length && activeIssueIndex !== 0) {
            onActiveIssueChange(0);
            return;
        }

        if (issues.length && activeIssueIndex > issues.length - 1) {
            onActiveIssueChange(issues.length - 1);
        }
    }, [activeIssueIndex, issues.length, onActiveIssueChange]);

    return (
        <View style={{ height }} className="bg-black">
            <ReelVideoSurface
                player={playback.player}
                hasVideo={!!playableUri}
                thumbnailUrl={analysis.thumbnail_url}
                isPreparing={isPreparing}
            />

            {isDrawingMode ? (
                <DetailedVideo
                    playback={playback}
                    onExitDrawing={() => onDrawingModeChange(false)}
                    onBack={onBack}
                />
            ) : (
                <>
                    <ReelPlaybackChrome playback={playback} />
                    <IssueShowcaseOverlay
                        issues={issues}
                        activeIssueIndex={activeIssueIndex}
                        onActiveIssueChange={onActiveIssueChange}
                    />
                </>
            )}
        </View>
    );
}
