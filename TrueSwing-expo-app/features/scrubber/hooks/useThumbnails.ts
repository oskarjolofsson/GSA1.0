import { useEffect, useState } from 'react';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { FRAME_COUNT } from '../utils/constants';

// Generates FRAME_COUNT evenly-spaced thumbnail URIs across the video, resolved in parallel and
// swapped in as they arrive so the strip can render placeholders meanwhile.
export function useThumbnails(videoUri: string | null, durationMs: number) {
  const [frames, setFrames] = useState<Array<string | null>>(() => Array(FRAME_COUNT).fill(null));

  useEffect(() => {
    if (!videoUri || durationMs <= 0) {
      setFrames(Array(FRAME_COUNT).fill(null));
      return;
    }
    setFrames(Array(FRAME_COUNT).fill(null));
    let cancelled = false;
    (async () => {
      await Promise.all(
        Array.from({ length: FRAME_COUNT }).map(async (_, i) => {
          if (cancelled) return;
          try {
            const t = Math.round((i / Math.max(1, FRAME_COUNT - 1)) * Math.max(0, durationMs - 100));
            const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, { time: t, quality: 0.4 });
            if (!cancelled && uri) {
              setFrames((p) => {
                const n = [...p];
                n[i] = uri;
                return n;
              });
            }
          } catch {
            // ignore — frame will stay as placeholder
          }
        })
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [videoUri, durationMs]);

  return frames;
}
