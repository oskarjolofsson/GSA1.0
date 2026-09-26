import { useMemo } from "react";
import { Pressable, StatusBar, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Pause, RotateCcw } from "lucide-react-native";

import type { ReelPlayback } from "features/analysis/hooks/useReelPlayback";

type ReelPlaybackChromeProps = {
    playback: ReelPlayback;
    allowTapToggle?: boolean;
    showCenterPlaybackIndicator?: boolean;
};

/**
 * Everything the feed lays over the video: the legibility gradient, tap-to-toggle,
 * and the centred paused/ended glyph. Kept apart from `ReelVideoSurface` so drawing
 * mode can swap this out without touching the video underneath.
 */
export default function ReelPlaybackChrome({
    playback,
    allowTapToggle = true,
    showCenterPlaybackIndicator = true,
}: ReelPlaybackChromeProps) {
    const isPlaybackEnded = useMemo(
        () => playback.duration > 0 && playback.currentTime >= playback.duration,
        [playback.currentTime, playback.duration]
    );

    return (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={["rgba(0,0,0,0.55)", "rgba(0,0,0,0.10)", "rgba(0,0,0,0.58)"]}
                locations={[0, 0.42, 1]}
                style={StyleSheet.absoluteFill}
            />

            <Pressable
                className="absolute inset-0 z-10"
                disabled={!allowTapToggle}
                onPress={playback.togglePlayPause}
            />

            {showCenterPlaybackIndicator && !playback.isPlaying && (
                <View className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                    <View className="mb-40 rounded-full bg-black/30 p-4">
                        {isPlaybackEnded ? (
                            <RotateCcw
                                size={30}
                                color="rgba(255, 255, 255, 0.6)" // 60% opacity for the outline
                                fill="transparent" // Remove the solid white fill
                                strokeWidth={1.5} // A thin outline
                            />
                        ) : (
                            <Pause
                                size={30}
                                color="rgba(255, 255, 255, 0.6)"
                                fill="transparent"
                                strokeWidth={1.5}
                            />
                        )}
                    </View>
                </View>
            )}
        </View>
    );
}
