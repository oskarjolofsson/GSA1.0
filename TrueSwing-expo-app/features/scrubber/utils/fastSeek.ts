import { Platform } from 'react-native';
import * as Native from '../../../modules/expo-fast-seek';
import type { VideoPlayer } from 'expo-video';

// During drag we want fast keyframe seeks on Android (PREVIOUS_SYNC) so the preview
// moves with the finger. On gesture release we want a precise (EXACT) seek so the
// final committed frame matches the trim handles. iOS always falls through to the
// AVPlayer path — assigning `currentTime` is already fast enough there.
export function fastSeekKeyframe(viewTag: number | null, player: VideoPlayer | null, posMs: number): void {
  if (Platform.OS === 'android' && Native.isAvailable && viewTag != null) {
     Native.seekKeyframe(viewTag, posMs);
   }
   if (player) player.currentTime = posMs / 1000;
}

export function fastSeekPrecise(viewTag: number | null, player: VideoPlayer | null, posMs: number): void {
  if (Platform.OS === 'android' && Native.isAvailable && viewTag != null) {
     Native.seekPrecise(viewTag, posMs);
   }
   if (player) player.currentTime = posMs / 1000;
}

export const fastSeekIsNative = Native.isAvailable;
