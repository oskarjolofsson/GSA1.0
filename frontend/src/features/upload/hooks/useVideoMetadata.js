import { useState, useEffect, useRef } from 'react';

export function useVideoMetadata(previewUrl) {
  const videoRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Reset state when previewUrl changes
  useEffect(() => {
    setDuration(0);
    setIsLoaded(false);
    setError(null);
  }, [previewUrl]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onLoadedMetadata = () => {
      const d = Number.isFinite(v.duration) ? v.duration : 0;
      if (d > 0) {
        setDuration(d);
        setIsLoaded(true);
      }
    };

    const onDurationChange = () => {
      const d = Number.isFinite(v.duration) ? v.duration : 0;
      if (d > 0) {
        setDuration(d);
      }
    };

    const onCanPlay = () => {
      setIsLoaded(true);
    };

    const onError = (e) => {
      console.error("Video error:", v.error?.code, v.error?.message);
      setError("Error loading video preview.");
      setIsLoaded(false);
    };

    v.addEventListener("loadedmetadata", onLoadedMetadata);
    v.addEventListener("durationchange", onDurationChange);
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("error", onError);

    // Force load on mobile
    v.load();

    // If metadata is already loaded
    if (v.readyState >= 1) {
      onLoadedMetadata();
    }

    return () => {
      v.removeEventListener("loadedmetadata", onLoadedMetadata);
      v.removeEventListener("durationchange", onDurationChange);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("error", onError);
    };
  }, [previewUrl]);

  return {
    videoRef,
    duration,
    isLoaded,
    error,
  };
}
