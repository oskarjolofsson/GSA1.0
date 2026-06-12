import { requireOptionalNativeModule } from 'expo-modules-core';

// Module name must match the Kotlin `Name("VideoRekeyframe")` declaration.
const Native = requireOptionalNativeModule<{
  transcode(inputPath: string, outputPath: string, gopFrames: number): Promise<{
    outputPath: string;
    durationMs: number;
  }>;
}>('VideoRekeyframe');

export const isAvailable = !!Native;

export async function transcodeDenseKeyframes(
  inputPath: string,
  outputPath: string,
  gopFrames: number,
): Promise<{ outputPath: string; durationMs: number }> {
  if (!Native) {
    throw new Error('VideoRekeyframe native module unavailable on this platform');
  }
  return Native.transcode(inputPath, outputPath, gopFrames);
}
