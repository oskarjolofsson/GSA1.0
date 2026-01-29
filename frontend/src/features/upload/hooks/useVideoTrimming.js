import { useState, useEffect } from 'react';
import { validateTrimming } from '../logic/videoTrimValidation';

export function useVideoTrimming(duration, onTimeChange) {
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);

  // Initialize end when duration is loaded
  useEffect(() => {
    if (duration > 0 && end === 0) {
      setEnd(duration);
    }
  }, [duration, end]);

  // Notify parent of time changes
  useEffect(() => {
    if (onTimeChange) {
      onTimeChange(start, end);
    }
  }, [start, end, onTimeChange]);

  const setRange = ([newStart, newEnd]) => {
    setStart(newStart);
    setEnd(newEnd);
  };

  const validation = validateTrimming(duration, start, end);

  return {
    start,
    end,
    setStart,
    setEnd,
    setRange,
    trimmedLength: validation.trimmedLength,
    validation,
  };
}
