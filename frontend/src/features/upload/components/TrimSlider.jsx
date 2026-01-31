import { Range } from "react-range";
import { formatTime } from "../utils/timeFormatter";
import { VIDEO_CONSTANTS } from "../constants/videoConstants";

export default function TrimSlider({ start, end, duration, onChange, isInvalid }) {
  return (
    <div className="mt-4 px-2">
      <Range
        step={0.01}
        min={0}
        max={Math.max(duration, 0.01)}
        values={[start, end]}
        onChange={onChange}
        renderTrack={({ props, children }) => (
          <div
            onMouseDown={props.onMouseDown}
            onTouchStart={props.onTouchStart}
            className="h-6 flex w-full rounded-full"
            style={props.style}
          >
            <div
              ref={props.ref}
              className="h-2 w-full rounded-full bg-white/10 self-center relative"
            >
              {/* Filled track between handles */}
              <div
                className={`absolute h-2 rounded-full ${
                  isInvalid ? 'bg-red-500/60' : 'bg-emerald-500/60'
                }`}
                style={{
                  left: `${(start / (duration || 1)) * 100}%`,
                  right: `${100 - (end / (duration || 1)) * 100}%`,
                }}
              />
              {children}
            </div>
          </div>
        )}
        renderThumb={({ props, isDragged, index }) => {
          const value = index === 0 ? start : end;
          const percentage = (value / (duration || 1)) * 100;
          
          return (
            <div
              {...props}
              className="relative"
              style={{
                ...props.style,
              }}
            >
              <div
                className={`h-5 w-5 rounded-full transition-colors ${
                  isDragged
                    ? "bg-white shadow-lg shadow-white/50"
                    : "bg-white/80 hover:bg-white"
                }`}
                style={{
                  boxShadow: isDragged ? "0 0 8px rgba(255, 255, 255, 0.5)" : "none",
                }}
              />
              {/* Value label underneath thumb */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 text-xs font-semibold text-white/90 whitespace-nowrap pointer-events-none">
                {formatTime(value)}
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
