import { useRef, useState, useCallback, useEffect } from 'react';
import { VIDEO_CONSTANTS } from '../constants/videoConstants';

export function useVideoSeek(videoRef) {
  const seekTimeoutRef = useRef(null);
  const [isSeeking, setIsSeeking] = useState(false);

  // Cleanup seek timeout on unmount
  useEffect(() => {
    return () => {
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
      }
    };
  }, []);

  const seekTo = useCallback((time) => {
    const v = videoRef?.current;
    if (!v) return;

    // Clear any pending seek
    if (seekTimeoutRef.current) {
      clearTimeout(seekTimeoutRef.current);
    }

    // Debounce seeks to prevent overwhelming mobile browsers
    seekTimeoutRef.current = setTimeout(() => {
      if (isSeeking) return;
      setIsSeeking(true);

      const onSeeked = () => {
        v.removeEventListener('seeked', onSeeked);
        setIsSeeking(false);
      };

      v.addEventListener('seeked', onSeeked);
      v.currentTime = time;

      // Fallback: clear seeking state after timeout in case seeked doesn't fire
      setTimeout(() => {
        if (isSeeking) {
          setIsSeeking(false);
        }
      }, VIDEO_CONSTANTS.SEEK_TIMEOUT_MS);
    }, VIDEO_CONSTANTS.SEEK_DEBOUNCE_MS);
  }, [videoRef, isSeeking]);

  return seekTo;
}
