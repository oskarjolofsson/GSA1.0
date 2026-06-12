import { useCallback } from "react";
import { useScreenSequence } from "features/shared/hooks/useScreenState";

type UploadScreen = "SelectVideo" | "TrimVideo" | "Prompts" | "UploadProgress";
const screens: UploadScreen[] = ["SelectVideo", "TrimVideo", "Prompts", "UploadProgress"];

export function useUploadFlowSequence() {
    const { currentScreen, next, prev, goTo } = useScreenSequence<UploadScreen>({ screens });

    const goToSelectVideo = useCallback(() => goTo("SelectVideo"), [goTo]);
    const goToTrimVideo = useCallback(() => goTo("TrimVideo"), [goTo]);
    const goToPrompts = useCallback(() => goTo("Prompts"), [goTo]);
    const goToUploadProgress = useCallback(() => goTo("UploadProgress"), [goTo]);

    return {
        currentScreen,
        next,
        prev,
        goToSelectVideo,
        goToTrimVideo,
        goToPrompts,
        goToUploadProgress,
    };
}
