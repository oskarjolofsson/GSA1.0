import { useMemo } from "react";
import { Text, View, StatusBar, Dimensions, Pressable, Image } from "react-native";
import { VideoView, type VideoSource } from "expo-video";
import { LinearGradient } from "expo-linear-gradient";
import TextBox from "features/shared/components/TextBox";
import { Pause, RotateCcw } from "lucide-react-native";
import useReelPlayback from "features/analysis/hooks/useReelPlayback";

const { width, height } = Dimensions.get("window");

type ReelProps = {
    video_url: string | null
    thumbnail_url?: string | null
    shouldPlay?: boolean
    allowTapToggle?: boolean
    showCenterPlaybackIndicator?: boolean
}

export default function Reel({
    video_url,
    thumbnail_url,
    shouldPlay = true,
    allowTapToggle = true,
    showCenterPlaybackIndicator = true,
}: ReelProps) {

    const source: VideoSource | null = video_url ? video_url : null;
    const playback = useReelPlayback({
        source,
        shouldPlay,
        muted: true,
        loop: false,
    });

    const isPlaybackEnded = useMemo(
        () => playback.duration > 0 && playback.currentTime >= playback.duration,
        [playback.currentTime, playback.duration]
    );

    if (!source) {
        return (
            <TextBox header="No video available" text="An error occured while loading the video" />
        )
    }

    return (
        <View style={{ width, height }} className="bg-black">
            <StatusBar barStyle="light-content" />

            <View className="absolute inset-0">
                {thumbnail_url ? (
                    <>
                        <Image
                            source={{ uri: thumbnail_url }}
                            className="absolute h-full w-full"
                            blurRadius={28}
                            resizeMode="cover"
                        />
                        <View className="absolute h-full w-full bg-black/15" />
                    </>
                ) : null}

                {video_url ? (
                    <VideoView
                        player={playback.player}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="contain"
                        nativeControls={false}
                        fullscreenOptions={{ enable: false }}
                    />
                ) : (
                    <View className="flex-1 items-center justify-center bg-[#0B0D12]">
                        <Text className="text-zinc-500">No video available</Text>
                    </View>
                )}

                <LinearGradient
                    colors={[
                        "rgba(0,0,0,0.55)",
                        "rgba(0,0,0,0.10)",
                        "rgba(0,0,0,0.58)",
                    ]}
                    locations={[0, 0.42, 1]}
                    className="absolute inset-0"
                />

                <Pressable
                    className="absolute inset-0 z-10"
                    disabled={!allowTapToggle}
                    onPress={playback.togglePlayPause}
                />
            </View>

            {showCenterPlaybackIndicator && !playback.isPlaying && (
                <View className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <View className="bg-black/30 rounded-full p-4 mb-40">
                        {isPlaybackEnded ? (
                            <RotateCcw
                                size={30}
                                color="rgba(255, 255, 255, 0.6)" // 60% opacity for the outline
                                fill="transparent"               // Remove the solid white fill
                                strokeWidth={1.5}                // A thin outline
                            />
                        ) : (
                            <Pause
                                size={30}
                                color="rgba(255, 255, 255, 0.6)" // 60% opacity for the outline
                                fill="transparent"               // Remove the solid white fill
                                strokeWidth={1.5}                // A thin outline
                            />
                        )}
                    </View>
                </View>
            )}
        </View>
    )
}