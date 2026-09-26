import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trash2, Play, Pause, Undo, Pencil, X } from 'lucide-react-native';
import GlassIconButton, {
  BackChevronButton,
  CHROME_INSET,
  CHROME_TOP_GAP,
} from 'features/analysis/components/GlassIconButton';
import colors from 'lib/colors';
import { useCallback, useEffect, useState } from 'react';
import useAnalysisDrawing from 'features/analysis/hooks/useAnalysisDrawing';
import type { ReelPlayback } from 'features/analysis/hooks/useReelPlayback';
import AnalysisDrawingOverlay from 'features/analysis/components/AnalysisDrawingOverlay';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import VideoSeekBar from 'features/analysis/components/VideoSeekBar';

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
      transition={{ type: 'timing', duration: 500 }}
      pointerEvents="none"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
        backgroundColor: 'rgba(8,12,20,0.55)',
      }}>
      <Pencil size={12} color="rgba(226,232,240,0.7)" />
      <Text
        style={{
          color: 'rgba(226,232,240,0.7)',
          fontSize: 12,
          fontWeight: '500',
          letterSpacing: 0.2,
        }}>
        Draw anywhere on the video
      </Text>
    </MotiView>
  );
}

// ---------------------------------------------------------------------------
// DetailedVideo
// ---------------------------------------------------------------------------

type Props = {
  /**
   * Owned by the caller, which also renders the `ReelVideoSurface` underneath: drawing
   * mode is an overlay on the video already playing, not a second player.
   */
  playback: ReelPlayback;
  /** Leaves drawing mode and returns to the reel. */
  onExitDrawing: () => void;
  /** Leaves the reel entirely (back to profile). Falls back to exiting drawing mode. */
  onBack?: () => void;
};

export default function DetailedVideo({ playback, onExitDrawing, onBack }: Props) {
  const insets = useSafeAreaInsets();

  const {
    strokes,
    activeStroke,
    beginStroke,
    extendStroke,
    commitStroke,
    undoLastStroke,
    clearAllStrokes,
  } = useAnalysisDrawing();

  const closeDrawingMode = useCallback(() => {
    clearAllStrokes();
    onExitDrawing();
  }, [clearAllStrokes, onExitDrawing]);

  // Back leaves the whole reel; only when there's nowhere to go back to does it
  // fall through to dropping out of drawing mode.
  const handleBack = onBack ?? closeDrawingMode;

  useEffect(() => {
    return () => {
      clearAllStrokes();
    };
  }, [clearAllStrokes]);

  const topY = insets.top + CHROME_TOP_GAP;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {/* ── Legibility gradient (drawing mode keeps the video brighter than the feed) ── */}
      <LinearGradient
        colors={['rgba(0,0,0,0.28)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.65)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* ── Drawing overlay ── */}
      <AnalysisDrawingOverlay
        strokes={strokes}
        activeStroke={activeStroke}
        onStrokeStart={beginStroke}
        onStrokeMove={extendStroke}
        onStrokeEnd={commitStroke}
      />

      {/* ── Top-left: Back (leaves the reel entirely) ── */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: topY,
          left: CHROME_INSET,
          zIndex: 50,
          elevation: 50,
        }}>
        <BackChevronButton onPress={handleBack} />
      </View>

      {/* ── Top-right: hint banner (auto-fades after 4 s) ── */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: topY + 70,
          left: 0,
          right: 16,
          zIndex: 50,
          elevation: 50,
          alignItems: 'center',
        }}>
        <DrawHint />
      </View>

      {/* ── Top-right: Undo · Clear all · Exit drawing ── */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: topY,
          right: CHROME_INSET,
          zIndex: 50,
          elevation: 50,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}>
        <GlassIconButton
          onPress={undoLastStroke}
          accessibilityLabel="Undo last stroke"
          icon={<Undo size={20} color={colors.sand} />}
        />
        <GlassIconButton
          onPress={clearAllStrokes}
          accessibilityLabel="Clear all drawing"
          icon={<Trash2 size={20} color={colors.sand} />}
        />
        <GlassIconButton
          onPress={closeDrawingMode}
          accessibilityLabel="Exit drawing mode"
          icon={<X size={20} color={colors.sand} strokeWidth={2} />}
        />
      </View>

      {/* ── Bottom-centre: Play / Pause ── */}
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <View
          style={{
            position: 'absolute',
            left: 8,
            right: 8,
            bottom: Math.max(insets.bottom + 95, 16),
            zIndex: 30,
            elevation: 30,
            alignItems: 'center',
          }}>
          <GlassIconButton
            onPress={playback.togglePlayPause}
            accessibilityLabel={playback.isPlaying ? 'Pause' : 'Play'}
            icon={
              <MotiView
                key={playback.isPlaying ? 'pause' : 'play'}
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: 'timing', duration: 120 }}>
                {playback.isPlaying ? (
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
            position: 'absolute',
            left: 8,
            right: 8,
            bottom: Math.max(insets.bottom + 45, 16),
            zIndex: 30,
            elevation: 30,
          }}>
          <VideoSeekBar
            currentTime={playback.currentTime}
            duration={playback.duration}
            isPlaying={playback.isPlaying}
            onSeekStart={playback.beginScrub}
            onSeekChange={(time) => playback.updateScrub(time, true)}
            onSeekComplete={(time) => playback.endScrub(time)}
            onPlayPause={playback.togglePlayPause}
          />
        </View>
      </View>
    </View>
  );
}
