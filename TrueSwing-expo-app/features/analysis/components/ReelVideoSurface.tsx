import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { VideoView, type VideoPlayer } from "expo-video";

type ReelVideoSurfaceProps = {
    player: VideoPlayer | null;
    hasVideo: boolean;
    thumbnailUrl?: string | null;
    isPreparing?: boolean;
};

/**
 * The video itself plus its blurred-thumbnail backdrop, and nothing else.
 *
 * It belongs to whoever owns the player, so it stays mounted across mode switches
 * (reel ⇄ drawing). Unmounting the VideoView means the next mount has to re-open and
 * re-buffer the source, and until the first frame lands only the blurred thumbnail is
 * on screen — which reads as the video "blurring out" for a moment.
 */
export default function ReelVideoSurface({
    player,
    hasVideo,
    thumbnailUrl,
    isPreparing = false,
}: ReelVideoSurfaceProps) {
    return (
        <View style={StyleSheet.absoluteFill}>
            {thumbnailUrl ? (
                <>
                    <Image
                        source={{ uri: thumbnailUrl }}
                        style={StyleSheet.absoluteFill}
                        blurRadius={28}
                        resizeMode="cover"
                    />
                    <View
                        style={{
                            ...StyleSheet.absoluteFillObject,
                            backgroundColor: "rgba(0, 0, 0, 0.15)",
                        }}
                    />
                </>
            ) : null}

            {isPreparing ? (
                <View style={StyleSheet.absoluteFill} className="items-center justify-center">
                    <ActivityIndicator size="large" color="#E2E8F0" />
                    <Text className="mt-3 text-zinc-300">Preparing video…</Text>
                </View>
            ) : hasVideo && player ? (
                <VideoView
                    player={player}
                    style={StyleSheet.absoluteFill}
                    contentFit="contain"
                    nativeControls={false}
                    fullscreenOptions={{ enable: false }}
                />
            ) : (
                <View className="flex-1 items-center justify-center bg-[#0B0D12]">
                    <Text className="text-zinc-500">No video available</Text>
                </View>
            )}
        </View>
    );
}
