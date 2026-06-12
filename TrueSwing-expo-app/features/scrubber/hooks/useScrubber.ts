import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import { SEEK_THROTTLE_MS } from '../utils/constants';
import {
  applyLeftDrag,
  applyRightDrag,
  clamp,
  pickHandle,
  pxToMs,
  type HandleId,
} from '../utils/scrubberMath';
import type { ScrubberAPI, ScrubberMode, ScrubberRange } from '../types';

export type SeekKind = 'keyframe' | 'exact';

interface UseScrubberOpts {
  durationMs: number;
  mode: ScrubberMode;
  onSeek: (ms: number, kind: SeekKind) => void;
  onScrubStart?: () => void;
  // Fires once on gesture end with the final range — this is the commit point that
  // upload's TrimVideoScreen consumes to call useVideo.trimVideo().
  onScrubEnd?: (range: ScrubberRange & { playheadMs: number }) => void;
}

export function useScrubber(opts: UseScrubberOpts): ScrubberAPI {
  const { durationMs, mode, onSeek, onScrubStart, onScrubEnd } = opts;

  const trackW = useSharedValue(0);
  const pxL = useSharedValue(0);
  const pxR = useSharedValue(0);
  const playheadPx = useSharedValue(0);
  const startMs = useSharedValue(0);
  const endMs = useSharedValue(durationMs);
  const playheadMs = useSharedValue(0);
  const isScrubbing = useSharedValue(false);
  const activeHandle = useSharedValue<HandleId>(null);

  // Throttle bookkeeping (UI thread).
  const lastSeekTs = useSharedValue(0);
  const pendingSeekMs = useSharedValue(-1); // -1 = nothing pending

  // For slide mode — remember handle positions at gesture start.
  const slideStartL = useSharedValue(0);
  const slideStartR = useSharedValue(0);

  // Latest callbacks via refs so the gesture builder doesn't depend on referential stability of props.
  const callbacks = useRef({ onSeek, onScrubStart, onScrubEnd });
  callbacks.current = { onSeek, onScrubStart, onScrubEnd };

  // Reset on duration change (new video).
  useEffect(() => {
    startMs.value = 0;
    endMs.value = durationMs;
    playheadMs.value = 0;
    if (trackW.value > 0) {
      pxL.value = 0;
      pxR.value = trackW.value;
      playheadPx.value = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationMs]);

  const setTrackWidth = useCallback(
    (w: number) => {
      if (w === trackW.value) return;
      trackW.value = w;
      if (pxR.value === 0 && w > 0) {
        pxR.value = w;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // JS-side wrappers — read from refs so we don't recapture stale props.
  const onSeekJS = useCallback((ms: number, kind: SeekKind) => {
    callbacks.current.onSeek(ms, kind);
  }, []);
  const onScrubStartJS = useCallback(() => {
    callbacks.current.onScrubStart?.();
  }, []);
  const onScrubEndJS = useCallback(
    (s: number, e: number, p: number) => {
      callbacks.current.onScrubEnd?.({ startMs: s, endMs: e, playheadMs: p });
    },
    []
  );

  const gesture = useMemo(() => {
    return Gesture.Pan()
      .minDistance(0)
      .onBegin((e) => {
        'worklet';
        const handle = pickHandle(e.x, pxL.value, pxR.value, trackW.value, mode);
        if (!handle) return;
        activeHandle.value = handle;
        isScrubbing.value = true;
        if (handle === 'S') {
          slideStartL.value = pxL.value;
          slideStartR.value = pxR.value;
        }
        runOnJS(onScrubStartJS)();
      })
      .onUpdate((e) => {
        'worklet';
        const h = activeHandle.value;
        if (!h) return;
        let seekTargetMs = playheadMs.value;
        if (h === 'L') {
          const newL = applyLeftDrag(e.x, pxR.value);
          pxL.value = newL;
          const ms = pxToMs(newL, trackW.value, durationMs);
          startMs.value = ms;
          playheadMs.value = ms;
          playheadPx.value = newL;
          seekTargetMs = ms;
        } else if (h === 'R') {
          const newR = applyRightDrag(e.x, pxL.value, trackW.value);
          pxR.value = newR;
          const ms = pxToMs(newR, trackW.value, durationMs);
          endMs.value = ms;
          playheadMs.value = ms;
          playheadPx.value = newR;
          seekTargetMs = ms;
        } else if (h === 'S') {
          const sw = slideStartR.value - slideStartL.value;
          const newL = clamp(slideStartL.value + e.translationX, 0, trackW.value - sw);
          const newR = newL + sw;
          pxL.value = newL;
          pxR.value = newR;
          const ms = pxToMs(newL, trackW.value, durationMs);
          startMs.value = ms;
          endMs.value = pxToMs(newR, trackW.value, durationMs);
          playheadMs.value = ms;
          playheadPx.value = newL;
          seekTargetMs = ms;
        } else {
          // 'P' — playhead mode
          const x = clamp(e.x, 0, trackW.value);
          playheadPx.value = x;
          const ms = pxToMs(x, trackW.value, durationMs);
          playheadMs.value = ms;
          seekTargetMs = ms;
        }

        // Time-gated dispatch — keeps ExoPlayer from queueing a backlog of seek requests.
        const now = Date.now();
        if (now - lastSeekTs.value >= SEEK_THROTTLE_MS) {
          lastSeekTs.value = now;
          pendingSeekMs.value = -1;
          runOnJS(onSeekJS)(seekTargetMs, 'keyframe');
        } else {
          pendingSeekMs.value = seekTargetMs;
        }
      })
      .onEnd(() => {
        'worklet';
        const finalMs = pendingSeekMs.value >= 0 ? pendingSeekMs.value : playheadMs.value;
        pendingSeekMs.value = -1;
        isScrubbing.value = false;
        activeHandle.value = null;
        runOnJS(onSeekJS)(finalMs, 'exact');
        runOnJS(onScrubEndJS)(startMs.value, endMs.value, playheadMs.value);
      })
      .onTouchesCancelled(() => {
        'worklet';
        isScrubbing.value = false;
        activeHandle.value = null;
      });
    // Re-create only when mode or duration changes; callback refs are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, durationMs]);

  const getRange = useCallback(
    () => ({ startMs: startMs.value, endMs: endMs.value }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return {
    gesture,
    mode,
    pxL,
    pxR,
    playheadPx,
    trackW,
    startMs,
    endMs,
    playheadMs,
    isScrubbing,
    activeHandle,
    setTrackWidth,
    getRange,
  };
}
