import { requireOptionalNativeModule } from 'expo-modules-core';

// Module name must match the Kotlin/Swift `Name("FastSeek")` declarations.
const Native = requireOptionalNativeModule<{
  seekKeyframe(viewTag: number, posMs: number): void;
  seekPrecise(viewTag: number, posMs: number): void;
}>('FastSeek');

export const isAvailable = !!Native;

export function seekKeyframe(viewTag: number, posMs: number): void {
  Native?.seekKeyframe?.(viewTag, posMs);
}

export function seekPrecise(viewTag: number, posMs: number): void {
  Native?.seekPrecise?.(viewTag, posMs);
}
