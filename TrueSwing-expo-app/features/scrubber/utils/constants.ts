import { Platform } from 'react-native';

export const HW = 22;
export const BAR_H = 60;
export const BORD = 3;
export const FRAME_COUNT = 16;
export const MIN_SEL_PX = 30;
export const TRIM_H_MARGIN = Platform.OS === 'android' ? 20 : 8;

// UI-thread time gate between successive seek dispatches during drag.
// AVPlayer comfortably handles ~25Hz; ExoPlayer's default precise seek queues past ~12Hz.
export const SEEK_THROTTLE_MS = Platform.OS === 'android' ? 100 : 40;
