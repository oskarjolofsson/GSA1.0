
import type { Analysis } from "features/analysis/types";
import Reel from "features/analysis/components/Reel";
import useVideoURL from "features/analysis/hooks/useVideoURL";

export default function ReelContainer({
    analysis,
    isActive,
}: {
    analysis: Analysis;
    isActive: boolean;
}) {
    const videoURL = useVideoURL(analysis);

    return (
        <Reel
            video_url={videoURL ?? null}
            shouldPlay={isActive}
        />
    );
}