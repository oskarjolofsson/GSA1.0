import { HW, MIN_SEL_PX } from './constants';

export type HandleId = 'L' | 'R' | 'S' | 'P' | null;

export function clamp(v: number, lo: number, hi: number): number {
  'worklet';
  return Math.max(lo, Math.min(hi, v));
}

export function pxToMs(px: number, trackW: number, durationMs: number): number {
  'worklet';
  if (trackW <= 0) return 0;
  return clamp(Math.round((px / trackW) * durationMs), 0, durationMs);
}

export function msToPx(ms: number, trackW: number, durationMs: number): number {
  'worklet';
  if (durationMs <= 0) return 0;
  return clamp((ms / durationMs) * trackW, 0, trackW);
}

// Decide which handle (L/R/S/P) the touch landed on.
// trim mode: L, R, or S (slide between handles).
// playhead mode: P only — the entire track scrubs the playhead.
export function pickHandle(
  x: number,
  pxL: number,
  pxR: number,
  trackW: number,
  mode: 'trim' | 'playhead'
): HandleId {
  'worklet';
  if (trackW <= 0) return null;
  if (mode === 'playhead') return 'P';
  const onL = x >= pxL - 4 && x <= pxL + HW;
  const onR = x >= pxR - HW && x <= pxR + 4;
  if (onL && onR) {
    return Math.abs(x - (pxL + HW / 2)) <= Math.abs(x - (pxR - HW / 2)) ? 'L' : 'R';
  }
  if (onL) return 'L';
  if (onR) return 'R';
  if (x > pxL && x < pxR) return 'S';
  return null;
}

export function applyLeftDrag(
  rawX: number,
  pxR: number
): number {
  'worklet';
  return clamp(rawX, 0, pxR - MIN_SEL_PX);
}

export function applyRightDrag(
  rawX: number,
  pxL: number,
  trackW: number
): number {
  'worklet';
  return clamp(rawX, pxL + MIN_SEL_PX, trackW);
}
