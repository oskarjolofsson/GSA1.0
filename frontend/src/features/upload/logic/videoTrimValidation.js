import { VIDEO_CONSTANTS } from '../constants/videoConstants';

export function validateTrimming(duration, start, end) {
  const trimmedLength = Math.max(0, end - start);
  const errors = {};
  
  if (duration > VIDEO_CONSTANTS.MAX_TRIMMED_LENGTH) {
    if (start === 0 && end === duration) {
      errors.trim = 'Video must be trimmed before upload';
    }
    if (trimmedLength > VIDEO_CONSTANTS.MAX_TRIMMED_LENGTH) {
      errors.duration = `Trimmed video must be ≤ ${VIDEO_CONSTANTS.MAX_TRIMMED_LENGTH} seconds`;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    trimmedLength,
    needsTrimming: duration > VIDEO_CONSTANTS.MAX_TRIMMED_LENGTH,
  };
}
