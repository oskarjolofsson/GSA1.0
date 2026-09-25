import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View, Dimensions } from "react-native";
import { VideoView, type VideoSource } from "expo-video";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, Trash2, Play, Pause, Undo, Pencil } from "lucide-react-native";
import GlassSurface from "features/shared/components/GlassSurface";
import colors from "lib/colors";
import type { Analysis } from "features/analysis/types";
import { useCallback, useEffect, useState } from "react";
import useAnalysisDrawing from "features/analysis/hooks/useAnalysisDrawing";
import useReelPlayback from "features/analysis/hooks/useReelPlayback";
import useScrubFriendlyVideo from "features/analysis/hooks/useScrubFriendlyVideo";
import AnalysisDrawingOverlay from "features/analysis/components/AnalysisDrawingOverlay";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView } from "moti";
import VideoSeekBar from "features/analysis/components/VideoSeekBar";

// ---------------------------------------------------------------------------
// OverlayIconButton
// ---------------------------------------------------------------------------

export const OVERLAY_BUTTON = 44;

type OverlayIconButtonProps = {
    onPress: () => void;
    icon: React.ReactNode;
    accessibilityLabel: string;
    hitSlop?: number;
};

function OverlayIconButton({ onPress, icon, accessibilityLabel, hitSlop = 10 }: OverlayIconButtonProps) {
    return (
        <Pressable
            onPress={onPress}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
            })}
        >
            <GlassSurface
                radius={OVERLAY_BUTTON / 2}
                interactive
                style={{
                    width: OVERLAY_BUTTON,
                    height: OVERLAY_BUTTON,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {icon}
            </GlassSurface>
        </Pressable>
    );
}

// ---------------------------------------------------------------------------
// DrawHint
// ---------------------------------------------------------------------------

function DrawHint() {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => setVisible(false), 4000);
        return () => clearTimeout(t);
    }, []);

    return (
        <MotiView
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{ type: "timing", duration: 500 }}
            pointerEvents="none"
            style={{
                flexDirection: "row",
                alignItems: "center",
                alignSelf: "flex-end",
                gap: 6,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.16)",
                backgroundColor: "rgba(8,12,20,0.55)",
            }}
        >
            <Pencil size={12} color="rgba(226,232,240,0.7)" />
            <Text
                style={{
                    color: "rgba(226,232,240,0.7)",
                    fontSize: 12,
                    fontWeight: "500",
                    letterSpacing: 0.2,
                }}
            >
                Draw anywhere on the video
            </Text>
        </MotiView>
    );
}

// ---------------------------------------------------------------------------
// DetailedVideo
// ---------------------------------------------------------------------------

type Props = {
    analysis: Analysis;
    videoURL: string | null;
    isActive: boolean;
    onExit: () => void;
};

const { height } = Dimensions.get("window");

export default function DetailedVideo({ analysis, videoURL, onExit, isActive }: Props) {
    const insets = useSafeAreaInsets();

    const {
        strokes,
        activeStroke,
        hasStrokes,
        beginStroke,
        extendStroke,
        commitStroke,
        undoLastStroke,
        clearAllStrokes,
    } = useAnalysisDrawing();

    const { uri: playableUri, status: prepStatus } = useScrubFriendlyVideo(
        analysis.analysis_id,
        videoURL,
    );
    const isPreparing = prepStatus === "preparing";

    const drawingSource: VideoSource | null = playableUri;
    const drawPlayback = useReelPlayback({
        source: drawingSource,
        shouldPlay: isActive && !isPreparing,
        muted: true,
        loop: false,
    });

    const closeDrawingMode = useCallback(() => {
        clearAllStrokes();
        onExit();
    }, [clearAllStrokes, onExit]);

    useEffect(() => {
        return () => {
            clearAllStrokes();
        };
    }, [clearAllStrokes]);

    const topY = Math.max(insets.top + 8, 16);

    return (
        <View style={{ height }} className="bg-black">

            {/* ── Background layer ── */}
            <View style={StyleSheet.absoluteFill}>
                {analysis.thumbnail_url ? (
                    <>
                        <Image
                            source={{ uri: analysis.thumbnail_url }}
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

                {drawPlayback.player && !isPreparing ? (
                    <VideoView
                        player={drawPlayback.player}
                        style={StyleSheet.absoluteFill}
                        contentFit="contain"
                        nativeControls={false}
                        fullscreenOptions={{ enable: false }}
                    />
                ) : isPreparing ? (
                    <View style={StyleSheet.absoluteFill} className="items-center justify-center">
                        <ActivityIndicator size="large" color="#E2E8F0" />
                        <Text className="text-zinc-300 mt-3">Preparing video…</Text>
                    </View>
                ) : (
                    <View className="flex-1 items-center justify-center bg-[#0B0D12]">
                        <Text className="text-zinc-500">No video available</Text>
                    </View>
                )}

                <LinearGradient
                    colors={["rgba(0,0,0,0.28)", "rgba(0,0,0,0.05)", "rgba(0,0,0,0.65)"]}
                    locations={[0, 0.45, 1]}
                    style={StyleSheet.absoluteFill}
                />
            </View>

            {/* ── Drawing overlay ── */}
            <AnalysisDrawingOverlay
                strokes={strokes}
                activeStroke={activeStroke}
                onStrokeStart={beginStroke}
                onStrokeMove={extendStroke}
                onStrokeEnd={commitStroke}
            />

            {/* ── Top-left: Back ── */}
            <View
                pointerEvents="box-none"
                style={{ position: "absolute", top: topY, left: 20, zIndex: 50, elevation: 50 }}
            >
                <OverlayIconButton
                    onPress={closeDrawingMode}
                    accessibilityLabel="Back"
                    icon={<ChevronLeft size={26} color={colors.sand} strokeWidth={2} style={{ marginLeft: -2 }} />}
                />
            </View>

            {/* ── Top-right: hint banner (auto-fades after 4 s) ── */}
            <View
                pointerEvents="none"
                style={{
                    position: "absolute",  
                    top: topY + 70,
                    left: 0,
                    right: 16,
                    zIndex: 50,
                    elevation: 50,
                    alignItems: "center",
                }}
            >
                <DrawHint />
            </View>

            {/* ── Top-right: Undo ── */}
            <View
                pointerEvents="box-none"
                // 16 (the clear button's inset) + its 44 + 10 of air. The old pills were
                // 68 wide against a 50px gap, so undo sat partly underneath clear.
                style={{ position: "absolute", top: topY, right: 70, zIndex: 50, elevation: 50 }}
            >
                <OverlayIconButton
                    onPress={undoLastStroke}
                    accessibilityLabel="Undo last stroke"
                    icon={<Undo size={20} color={colors.sand} />}
                />
            </View>

            {/* ── Top-right: Clear all ── */}
            <View
                pointerEvents="box-none"
                style={{ position: "absolute", top: topY, right: 16, zIndex: 50, elevation: 50 }}
            >
                <OverlayIconButton
                    onPress={clearAllStrokes}
                    accessibilityLabel="Clear all drawing"
                    icon={<Trash2 size={20} color={colors.sand} />}
                />
            </View>

            {/* ── Bottom-centre: Play / Pause ── */}
            <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
                <View
                    style={{
                        position: "absolute",
                        left: 8,
                        right: 8,
                        bottom: Math.max(insets.bottom + 95, 16),
                        zIndex: 30,
                        elevation: 30,
                        alignItems: "center",
                    }}
                >
                    <OverlayIconButton
                        onPress={drawPlayback.togglePlayPause}
                        accessibilityLabel={drawPlayback.isPlaying ? "Pause" : "Play"}
                        icon={
                            <MotiView
                                key={drawPlayback.isPlaying ? "pause" : "play"}
                                from={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ type: "timing", duration: 120 }}
                            >
                                {drawPlayback.isPlaying ? (
                                    <Pause size={20} color={colors.sand} fill={colors.sand} />
                                ) : (
                                    // Nudged right: a play triangle centred on its bounding
                                    // box reads as sitting left of centre in a circle.
                                    <Play
                                        size={20}
                                        color={colors.sand}
                                        fill={colors.sand}
                                        style={{ marginLeft: 2 }}
                                    />
                                )}
                            </MotiView>
                        }
                    />
                </View>
            </View>

            {/* ── Bottom: Seek bar ── */}
            <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
                <View
                    style={{
                        position: "absolute",
                        left: 8,
                        right: 8,
                        bottom: Math.max(insets.bottom + 45, 16),
                        zIndex: 30,
                        elevation: 30,
                    }}
                >
                    <VideoSeekBar
                        currentTime={drawPlayback.currentTime}
                        duration={drawPlayback.duration}
                        isPlaying={drawPlayback.isPlaying}
                        onSeekStart={drawPlayback.beginScrub}
                        onSeekChange={(time) => drawPlayback.updateScrub(time, true)}
                        onSeekComplete={(time) => drawPlayback.endScrub(time)}
                        onPlayPause={drawPlayback.togglePlayPause}
                    />
                </View>
            </View>

        </View>
    );
}