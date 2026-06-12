import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView, type VideoPlayer, type VideoSource } from 'expo-video';
import { Pause, RotateCcw } from 'lucide-react-native';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { findNodeHandle, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScrubberBar from '../components/ScrubberBar';
import { useScrubber, type SeekKind } from '../hooks/useScrubber';
import { usePlayerSync } from '../hooks/usePlayerSync';
import type { ScrubberMode, ScrubberRange, ScrubberRef } from '../types';
import { fastSeekKeyframe, fastSeekPrecise } from '../utils/fastSeek';

interface Props {
  videoUri: string | null;
  mode?: ScrubberMode;
  onRangeChange?: (start: number, end: number) => void;
  // Optional styling pass-through to ScrubberBar
  handleColor?: string;
  handleIconColor?: string;
  selectionBorderColor?: string;
  dimColor?: string;
  playheadColor?: string;
  // Renders content on top of the video preview (e.g. analysis overlays).
  overlay?: React.ReactNode;
  // Renders between the preview and the bar — used by TrimVideoScreen for the Back/Next row.
  controls?: React.ReactNode;
  // If false, omits the dim gradient over the video.
  showGradient?: boolean;
}

// High-level composed scrubber: owns the expo-video player, video preview, tap-to-play
// behaviour, and the ScrubberBar. TrimVideoScreen uses this as a drop-in. Consumers who
// need a different layout (e.g. analysis playback where the bar lives in a different
// container) can use useScrubber() + <ScrubberBar /> directly.
const VideoScrubber = forwardRef<ScrubberRef, Props>(function VideoScrubber(
  {
    videoUri,
    mode = 'trim',
    onRangeChange,
    handleColor,
    handleIconColor,
    selectionBorderColor,
    dimColor,
    playheadColor,
    overlay,
    controls,
    showGradient = true,
  },
  ref
) {
  const source: VideoSource | null = videoUri ?? null;
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationMs, setDurationMs] = useState(0);

  const player: VideoPlayer = useVideoPlayer(source, (p) => {
    p.loop = false;
    p.muted = true;
    p.volume = 0;
    p.pause();
  });

  // The VideoView's React tag is what the native FastSeek module looks up.
  const videoViewRef = useRef<React.ComponentRef<typeof VideoView> | null>(null);
  const viewTagRef = useRef<number | null>(null);

  useEffect(() => {
    if (!player) return;
    setIsPlaying(player.playing);
    if (player.duration) setDurationMs(Math.floor(player.duration * 1000));

    const playingSub = player.addListener('playingChange', (e) => setIsPlaying(e.isPlaying));
    const statusSub = player.addListener('statusChange', (e) => {
      if (e.status === 'readyToPlay' && player.duration) {
        setDurationMs(Math.floor(player.duration * 1000));
      }
    });
    return () => {
      playingSub.remove();
      statusSub.remove();
    };
  }, [player]);

  const onSeek = useCallback(
    (ms: number, kind: SeekKind) => {
      const tag = viewTagRef.current;
      if (kind === 'keyframe') fastSeekKeyframe(tag, player, ms);
      else fastSeekPrecise(tag, player, ms);
    },
    [player]
  );

  const onScrubStart = useCallback(() => {
    if (player?.playing) player.pause();
  }, [player]);

  const onScrubEnd = useCallback(
    (range: ScrubberRange & { playheadMs: number }) => {
      onRangeChange?.(range.startMs, range.endMs);
    },
    [onRangeChange]
  );

  const scrubber = useScrubber({
    durationMs,
    mode,
    onSeek,
    onScrubStart,
    onScrubEnd,
  });

  usePlayerSync({
    player,
    durationMs,
    mode,
    playheadMs: scrubber.playheadMs,
    playheadPx: scrubber.playheadPx,
    trackW: scrubber.trackW,
    startMs: scrubber.startMs,
    endMs: scrubber.endMs,
    isScrubbing: scrubber.isScrubbing,
  });

  useImperativeHandle(
    ref,
    () => ({
      getRange: () => scrubber.getRange(),
      getPlayheadMs: () => scrubber.playheadMs.value,
    }),
    [scrubber]
  );

  const tapToPlay = () => {
    if (!player) return;
    if (player.playing) {
      player.pause();
    } else if (player.currentTime >= player.duration) {
      player.replay();
    } else {
      player.play();
    }
  };

  const gradientColors = useMemo(
    () => ['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.10)', 'rgba(0,0,0,0.58)'] as const,
    []
  );

  return (
    <View style={s.root}>
      <View style={s.previewWrap}>
        {videoUri ? (
          <VideoView
            ref={(r) => {
              videoViewRef.current = r;
              viewTagRef.current = r ? findNodeHandle(r as any) : null;
            }}
            player={player}
            style={s.video}
            contentFit="contain"
            nativeControls={false}
            fullscreenOptions={{ enable: false }}
          />
        ) : (
          <View style={s.empty} />
        )}

        {showGradient && (
          <LinearGradient
            colors={gradientColors}
            locations={[0, 0.42, 1]}
            style={StyleSheet.absoluteFill}
          />
        )}

        {overlay}

        <Pressable style={[StyleSheet.absoluteFill, { zIndex: 10 }]} onPress={tapToPlay} />

        {!isPlaying && player && (
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, s.centerIcon]}>
            <View style={s.iconBubble}>
              {player.currentTime >= player.duration ? (
                <RotateCcw size={30} color="rgba(255, 255, 255, 0.6)" fill="transparent" strokeWidth={1.5} />
              ) : (
                <Pause size={30} color="rgba(255, 255, 255, 0.6)" fill="transparent" strokeWidth={1.5} />
              )}
            </View>
          </View>
        )}
      </View>

      {/* Wrap controls + bar in a bottom SafeAreaView so the safe-area inset (Android
          nav bar, iOS home indicator) lands BELOW the bar — not between the buttons
          and the bar. Without this, on Android with gesture or 3-button nav the trim
          bar sits under the system nav bar and is hidden. */}
      <SafeAreaView edges={['bottom']} style={s.bottomSafe} className='pb-14'>
        {controls}
        {videoUri && (
          <ScrubberBar
            videoUri={videoUri}
            durationMs={durationMs}
            scrubber={scrubber}
            handleColor={handleColor}
            handleIconColor={handleIconColor}
            selectionBorderColor={selectionBorderColor}
            dimColor={dimColor}
            playheadColor={playheadColor}
          />
        )}
      </SafeAreaView>
    </View>
  );
});

const s = StyleSheet.create({
  root: { flex: 1 },
  previewWrap: { flex: 1, position: 'relative' },
  video: { width: '100%', height: '100%' },
  empty: { flex: 1, backgroundColor: '#0B0D12' },
  centerIcon: { alignItems: 'center', justifyContent: 'center', zIndex: 20 },
  iconBubble: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 999, padding: 16 },
  bottomSafe: { backgroundColor: '#000'},
});

export default VideoScrubber;
