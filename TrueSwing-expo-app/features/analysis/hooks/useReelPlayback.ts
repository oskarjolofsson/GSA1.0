import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVideoPlayer, type VideoSource } from "expo-video";

type UseReelPlaybackParams = {
    source: VideoSource | null;
    shouldPlay?: boolean;
    loop?: boolean;
    muted?: boolean;
};

const LIVE_SEEK_THROTTLE_MS = 33;
const LIVE_SEEK_EPSILON_SECONDS = 0.03;
const UI_TIME_EPSILON_SECONDS = 0.02;
const DURATION_EPSILON_SECONDS = 0.05;

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function formatTime(seconds: number) {
    if (!Number.isFinite(seconds) || seconds < 0) {
        return "00:00";
    }

    const totalSeconds = Math.floor(seconds);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function useReelPlayback({
    source,
    shouldPlay = true,
    loop = false,
    muted = true,
}: UseReelPlaybackParams) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [scrubTime, setScrubTime] = useState(0);
    const scrubWasPlayingRef = useRef(false);
    const lastLiveSeekAtRef = useRef(0);
    const lastLiveSeekValueRef = useRef(0);

    const setCurrentTimeIfChanged = useCallback((value: number) => {
        if (!Number.isFinite(value)) return;
        setCurrentTime((prev) =>
            Math.abs(prev - value) >= UI_TIME_EPSILON_SECONDS ? value : prev
        );
    }, []);

    const setDurationIfChanged = useCallback((value: number) => {
        if (!Number.isFinite(value)) return;
        setDuration((prev) =>
            Math.abs(prev - value) >= DURATION_EPSILON_SECONDS ? value : prev
        );
    }, []);

    const setScrubTimeIfChanged = useCallback((value: number) => {
        if (!Number.isFinite(value)) return;
        setScrubTime((prev) =>
            Math.abs(prev - value) >= UI_TIME_EPSILON_SECONDS ? value : prev
        );
    }, []);

    const player = useVideoPlayer(source, (playerInstance) => {
        playerInstance.loop = loop;
        playerInstance.muted = muted;
        playerInstance.volume = muted ? 0 : 1;

        if (shouldPlay) {
            playerInstance.play();
        } else {
            playerInstance.pause();
        }
    });

    useEffect(() => {
        if (!player) return;

        player.loop = loop;
        player.muted = muted;
        player.volume = muted ? 0 : 1;
    }, [loop, muted, player]);

    useEffect(() => {
        if (!player) return;

        if (shouldPlay) {
            if (player.currentTime >= player.duration && player.duration > 0) {
                player.replay();
            } else {
                player.play();
            }
        } else {
            player.pause();
        }
    }, [shouldPlay, player]);

    useEffect(() => {
        if (!player) return;

        setIsPlaying(player.playing);
        setDurationIfChanged(Number.isFinite(player.duration) ? player.duration : 0);
        setCurrentTimeIfChanged(Number.isFinite(player.currentTime) ? player.currentTime : 0);

        const playingSubscription = player.addListener("playingChange", (event) => {
            setIsPlaying(event.isPlaying);
        });

        const statusSubscription = player.addListener("statusChange", (event) => {
            if (event.status === "readyToPlay" && Number.isFinite(player.duration)) {
                setDuration(player.duration);
            }
        });

        const tick = setInterval(() => {
            if (!Number.isFinite(player.currentTime)) return;
            if (!isScrubbing) {
                setCurrentTimeIfChanged(player.currentTime);
            }

            if (Number.isFinite(player.duration)) {
                setDurationIfChanged(player.duration);
            }
        }, 100);

        return () => {
            playingSubscription.remove();
            statusSubscription.remove();
            clearInterval(tick);
        };
    }, [isScrubbing, player, setCurrentTimeIfChanged, setDurationIfChanged]);

    const seekTo = useCallback(
        (seconds: number) => {
            if (!player) return;
            const target = clamp(seconds, 0, Math.max(duration, 0));
            player.currentTime = target;
            setCurrentTimeIfChanged(target);
        },
        [duration, player, setCurrentTimeIfChanged]
    );

    const liveSeekTo = useCallback(
        (seconds: number) => {
            if (!player) return;

            const target = clamp(seconds, 0, Math.max(duration, 0));
            const now = Date.now();
            const timeSinceLastSeek = now - lastLiveSeekAtRef.current;
            const valueDelta = Math.abs(target - lastLiveSeekValueRef.current);

            if (
                timeSinceLastSeek < LIVE_SEEK_THROTTLE_MS &&
                valueDelta < LIVE_SEEK_EPSILON_SECONDS
            ) {
                return;
            }

            player.currentTime = target;
            lastLiveSeekAtRef.current = now;
            lastLiveSeekValueRef.current = target;
        },
        [duration, player]
    );

    const togglePlayPause = useCallback(() => {
        if (!player) return;

        if (player.playing) {
            setIsPlaying(false);
            player.pause();
            return;
        }

        setIsPlaying(true);
        if (player.currentTime >= player.duration && player.duration > 0) {
            player.replay();
        } else {
            player.play();
        }
    }, [player]);

    const beginScrub = useCallback(() => {
        scrubWasPlayingRef.current = !!player?.playing;
        if (player?.playing) {
            player.pause();
        }
        lastLiveSeekAtRef.current = 0;
        lastLiveSeekValueRef.current = currentTime;
        setIsScrubbing(true);
        setScrubTimeIfChanged(currentTime);
    }, [currentTime, player]);

    const updateScrub = useCallback(
        (seconds: number, liveSeek = false) => {
            const target = clamp(seconds, 0, Math.max(duration, 0));
            setScrubTimeIfChanged(target);

            if (liveSeek) {
                liveSeekTo(target);
            }
        },
        [duration, liveSeekTo, setScrubTimeIfChanged]
    );

    const updateScrubByRatio = useCallback(
        (ratio: number, liveSeek = false) => {
            const boundedRatio = clamp(ratio, 0, 1);
            const target = boundedRatio * Math.max(duration, 0);
            setScrubTimeIfChanged(target);

            if (liveSeek) {
                liveSeekTo(target);
            }
        },
        [duration, liveSeekTo, setScrubTimeIfChanged]
    );

    const endScrub = useCallback(
        (finalTime?: number) => {
            const target =
                typeof finalTime === "number"
                    ? clamp(finalTime, 0, Math.max(duration, 0))
                    : scrubTime;

            seekTo(target);
            setIsScrubbing(false);

            if (scrubWasPlayingRef.current && player) {
                player.play();
            }
        },
        [duration, player, scrubTime, seekTo]
    );

    const displayedTime = isScrubbing ? scrubTime : currentTime;

    const progress = useMemo(() => {
        if (duration <= 0) return 0;
        return clamp(displayedTime / duration, 0, 1);
    }, [displayedTime, duration]);

    const durationLabel = useMemo(() => formatTime(duration), [duration]);
    const currentTimeLabel = useMemo(() => formatTime(displayedTime), [displayedTime]);

    return {
        player,
        isPlaying,
        duration,
        currentTime,
        currentTimeLabel,
        durationLabel,
        isScrubbing,
        scrubTime,
        progress,
        togglePlayPause,
        seekTo,
        beginScrub,
        updateScrub,
        updateScrubByRatio,
        endScrub,
    };
}
