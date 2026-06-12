import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import {
    isAvailable as rekeyframeAvailable,
    transcodeDenseKeyframes,
} from "../../../modules/expo-video-rekeyframe";
import {
    cancelDownload,
    ensureCacheDirs,
    evictOldest,
    fileExists,
    originalCachePath,
    safeUnlink,
    scrubCachePath,
    startDownload,
} from "features/analysis/utils/videoCache";

type Status = "idle" | "preparing" | "ready" | "error";

type Result = {
    uri: string | null;
    status: Status;
    error?: Error;
};

const GOP_FRAMES = 2;
const MAX_CACHE_BYTES = 500 * 1024 * 1024; // 500 MB

function toFileUri(path: string): string {
    return path.startsWith("file://") ? path : `file://${path}`;
}

export default function useScrubFriendlyVideo(
    analysisId: string | null,
    remoteUrl: string | null,
): Result {
    const [result, setResult] = useState<Result>({ uri: null, status: "idle" });
    const cancelledRef = useRef(false);
    const activeJobIdRef = useRef<number | null>(null);

    useEffect(() => {
        cancelledRef.current = false;
        activeJobIdRef.current = null;

        if (!analysisId || !remoteUrl) {
            setResult({ uri: null, status: "idle" });
            return;
        }

        // iOS scrubs natively without dense keyframes; same when the native module isn't built.
        if (Platform.OS !== "android" || !rekeyframeAvailable) {
            setResult({ uri: remoteUrl, status: "ready" });
            return;
        }

        let didStart = false;

        (async () => {
            try {
                const scrubPath = scrubCachePath(analysisId);
                if (await fileExists(scrubPath)) {
                    if (cancelledRef.current) return;
                    setResult({ uri: toFileUri(scrubPath), status: "ready" });
                    return;
                }

                didStart = true;
                setResult({ uri: null, status: "preparing" });

                await ensureCacheDirs();
                if (cancelledRef.current) return;

                const origPath = originalCachePath(analysisId);
                await safeUnlink(origPath);
                const dl = startDownload(remoteUrl, origPath);
                activeJobIdRef.current = dl.jobId;
                await dl.promise;
                activeJobIdRef.current = null;
                if (cancelledRef.current) {
                    await safeUnlink(origPath);
                    return;
                }

                await transcodeDenseKeyframes(origPath, scrubPath, GOP_FRAMES);
                if (cancelledRef.current) {
                    await safeUnlink(origPath);
                    await safeUnlink(scrubPath);
                    return;
                }

                await safeUnlink(origPath);
                void evictOldest(MAX_CACHE_BYTES);

                setResult({ uri: toFileUri(scrubPath), status: "ready" });
            } catch (err) {
                if (cancelledRef.current) return;
                // Degraded path: fall back to the remote URL so playback still works.
                setResult({
                    uri: remoteUrl,
                    status: "error",
                    error: err instanceof Error ? err : new Error(String(err)),
                });
            }
        })();

        return () => {
            cancelledRef.current = true;
            if (activeJobIdRef.current != null) {
                cancelDownload(activeJobIdRef.current);
                activeJobIdRef.current = null;
            }
            if (didStart) {
                // Clean up an orphan original if we were mid-flight.
                void safeUnlink(originalCachePath(analysisId));
            }
        };
    }, [analysisId, remoteUrl]);

    return result;
}
