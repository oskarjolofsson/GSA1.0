import { formatTime } from "../utils/timeFormatter";
import { VIDEO_CONSTANTS } from "../constants/videoConstants";

export default function TrimStats({ trimmedLength, isValid }) {
  return (
    <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
      <div className="flex justify-between items-center text-xs text-white/80">
        <span className="font-medium">Total length of trimmed video:</span>
        <span className={`font-semibold ${isValid ? 'text-emerald-400' : 'text-red-400'}`}>
          {formatTime(trimmedLength)}
        </span>
      </div>
      <div className="text-xs text-white/50">
        Recommended length: {VIDEO_CONSTANTS.RECOMMENDED_MIN_LENGTH} to {VIDEO_CONSTANTS.RECOMMENDED_MAX_LENGTH} seconds. Must be ≤ {VIDEO_CONSTANTS.MAX_TRIMMED_LENGTH} seconds.
      </div>
    </div>
  );
}
