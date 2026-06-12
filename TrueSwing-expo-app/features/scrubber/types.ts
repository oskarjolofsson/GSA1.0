import type { SharedValue } from 'react-native-reanimated';
import type { ComposedGesture, GestureType } from 'react-native-gesture-handler';
import type { HandleId } from './utils/scrubberMath';

export type ScrubberMode = 'trim' | 'playhead';

export interface ScrubberRange {
  startMs: number;
  endMs: number;
}

export interface ScrubberRef {
  getRange(): ScrubberRange;
  getPlayheadMs(): number;
}

// What useScrubber returns. ScrubberBar consumes it; consumers may also
// read shared values directly for custom overlays.
export interface ScrubberAPI {
  gesture: GestureType | ComposedGesture;
  mode: ScrubberMode;
  pxL: SharedValue<number>;
  pxR: SharedValue<number>;
  playheadPx: SharedValue<number>;
  trackW: SharedValue<number>;
  startMs: SharedValue<number>;
  endMs: SharedValue<number>;
  playheadMs: SharedValue<number>;
  isScrubbing: SharedValue<boolean>;
  activeHandle: SharedValue<HandleId>;
  setTrackWidth(w: number): void;
  getRange(): ScrubberRange;
}
