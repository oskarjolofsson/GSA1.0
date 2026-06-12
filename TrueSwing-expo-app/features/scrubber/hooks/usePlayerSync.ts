import { useEffect } from 'react';
import type { VideoPlayer } from 'expo-video';
import { runOnUI, type SharedValue } from 'react-native-reanimated';
import { msToPx } from '../utils/scrubberMath';

interface PlayerSyncOpts {
  player: VideoPlayer | null;
  durationMs: number;
  mode: 'trim' | 'playhead';
  playheadMs: SharedValue<number>;
  playheadPx: SharedValue<number>;
  trackW: SharedValue<number>;
  startMs: SharedValue<number>;
  endMs: SharedValue<number>;
  isScrubbing: SharedValue<boolean>;
}

// Subscribes to expo-video's `timeUpdate` events and pushes the current time into
// the playhead shared values — but ONLY when not scrubbing. During scrub, the gesture
// owns the playhead. Also handles loop-within-cut in trim mode.
export function usePlayerSync(opts: PlayerSyncOpts) {
  const {
    player,
    durationMs,
    mode,
    playheadMs,
    playheadPx,
    trackW,
    startMs,
    endMs,
    isScrubbing,
  } = opts;

  useEffect(() => {
    if (!player) return;
    const sub = player.addListener('timeUpdate', (e) => {
      const tMs = e.currentTime * 1000;

      // Loop within cut for trim mode — JS side because we need to call player.currentTime.
      if (mode === 'trim') {
        const s = startMs.value;
        const eMs = endMs.value;
        if (eMs > s && tMs >= eMs - 16) {
          player.currentTime = s / 1000;
          return;
        }
      }

      // Push playhead into worklet land without re-rendering React.
      const w = trackW.value;
      runOnUI((ms: number, width: number, dur: number, scrubbing: boolean) => {
        'worklet';
        if (scrubbing) return;
        playheadMs.value = ms;
        playheadPx.value = msToPx(ms, width, dur);
      })(tMs, w, durationMs, isScrubbing.value);
    });
    return () => {
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, durationMs, mode]);
}
