import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { BAR_H, BORD, HW, TRIM_H_MARGIN } from '../utils/constants';
import { clamp } from '../utils/scrubberMath';
import { useThumbnails } from '../hooks/useThumbnails';
import DurationLabel from './DurationLabel';
import ScrubberHandle from './ScrubberHandle';
import ThumbnailStrip from './ThumbnailStrip';
import type { ScrubberAPI } from '../types';

interface Props {
  videoUri: string;
  durationMs: number;
  scrubber: ScrubberAPI;
  // Styling slots
  handleColor?: string;
  handleIconColor?: string;
  selectionBorderColor?: string;
  dimColor?: string;
  playheadColor?: string;
  thumbnailPlaceholderColor?: string;
  showDurationLabel?: boolean;
}

// The visual bar — thumbnails strip, dim overlays for un-selected regions, two
// trim handles, and the playhead line. The whole inner View is wrapped in a
// GestureDetector so the same surface handles taps on handles, slides, and (in
// playhead mode) playhead drags.
const ScrubberBar = ({
  videoUri,
  durationMs,
  scrubber,
  handleColor,
  handleIconColor,
  selectionBorderColor = '#FFFFFF',
  dimColor = 'rgba(0,0,0,0.55)',
  playheadColor = '#FFFFFF',
  thumbnailPlaceholderColor,
  showDurationLabel = true,
}: Props) => {
  const { gesture, pxL, pxR, playheadPx, trackW, startMs, endMs, playheadMs, mode, setTrackWidth } = scrubber;
  const frames = useThumbnails(videoUri, durationMs);
  const [trackWState, setTrackWState] = React.useState(0);

  const dimLeftStyle = useAnimatedStyle(() => ({ width: pxL.value }));
  const dimRightStyle = useAnimatedStyle(() => ({
    left: pxR.value,
    width: Math.max(0, trackW.value - pxR.value),
  }));
  const innerLeft = useDerivedValue(() => pxL.value + HW);
  const innerWidth = useDerivedValue(() => Math.max(0, pxR.value - HW - (pxL.value + HW)));
  const innerBorderStyle = useAnimatedStyle(() => ({ left: innerLeft.value, width: innerWidth.value }));

  // Trim mode: stretch the playback position across the selected region so the
  // playhead always lives between the inner edges of the handles. Playhead mode:
  // use the raw px position which already maps the full track to durationMs.
  const playheadStyle = useAnimatedStyle(() => {
    if (mode === 'playhead') return { left: playheadPx.value - 1 };
    const innerL = pxL.value + HW;
    const innerR = pxR.value - HW;
    const range = Math.max(1, endMs.value - startMs.value);
    const frac = clamp((playheadMs.value - startMs.value) / range, 0, 1);
    return { left: clamp(innerL + frac * (innerR - innerL), innerL, innerR) - 1 };
  });

  return (
    <View style={s.container}>
      {showDurationLabel && mode === 'trim' && <DurationLabel startMs={startMs} endMs={endMs} />}
      <GestureDetector gesture={gesture}>
        <View
          style={s.trackOuter}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            setTrackWidth(w);
            setTrackWState(w);
          }}
        >
          <ThumbnailStrip frames={frames} trackW={trackWState} placeholderColor={thumbnailPlaceholderColor} />

          {trackWState > 0 && (
            <>
              {mode === 'trim' && (
                <>
                  <Animated.View pointerEvents="none" style={[s.dim, { backgroundColor: dimColor }, dimLeftStyle]} />
                  <Animated.View pointerEvents="none" style={[s.dim, { backgroundColor: dimColor }, dimRightStyle]} />
                  <Animated.View pointerEvents="none" style={[s.borderTop, { backgroundColor: selectionBorderColor }, innerBorderStyle]} />
                  <Animated.View pointerEvents="none" style={[s.borderBottom, { backgroundColor: selectionBorderColor }, innerBorderStyle]} />
                  <ScrubberHandle side="left" position={pxL} color={handleColor} iconColor={handleIconColor} />
                  <ScrubberHandle side="right" position={pxR} color={handleColor} iconColor={handleIconColor} />
                </>
              )}
              <Animated.View pointerEvents="none" style={[s.playhead, { backgroundColor: playheadColor }, playheadStyle]} />
            </>
          )}
        </View>
      </GestureDetector>
    </View>
  );
};

const s = StyleSheet.create({
  container: { backgroundColor: '#000', paddingBottom: Platform.OS === 'ios' ? 6 : 4, paddingTop: 12 },
  trackOuter: {
    marginHorizontal: TRIM_H_MARGIN,
    height: BAR_H,
    position: 'relative',
    borderRadius: 4,
    overflow: 'hidden',
  },
  dim: { position: 'absolute', top: 0, bottom: 0, zIndex: 2 },
  borderTop: { position: 'absolute', top: 0, height: BORD, zIndex: 3 },
  borderBottom: { position: 'absolute', bottom: 0, height: BORD, zIndex: 3 },
  playhead: { position: 'absolute', top: BORD, bottom: BORD, width: 2, borderRadius: 1, zIndex: 9 },
});

export default ScrubberBar;
