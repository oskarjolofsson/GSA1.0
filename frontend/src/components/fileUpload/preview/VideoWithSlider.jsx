import { useEffect, useRef, useState, useCallback } from "react";
import ErrorPopup from "../../popup/ErrorPopup.jsx";

// Add keyframe animations for blinking and sliding
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse-border {
    0%, 100% { border-color: rgba(255, 255, 255, 0.3); }
    50% { border-color: rgba(255, 255, 255, 0.7); }
  }
  @keyframes slide-down {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes slide-up {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-10px);
    }
  }
  .blink-dropdown {
    animation: pulse-border 2s ease-in-out infinite;
  }
  .dropdown-slide-down {
    animation: slide-down 0.3s ease-out forwards;
  }
  .dropdown-slide-up {
    animation: slide-up 0.3s ease-out forwards;
  }
`;

if (typeof document !== 'undefined') {
  document.head.appendChild(style);
}

function formatTime(s, digits = 2) {
    if (!Number.isFinite(s)) return "0.00";
    return s.toFixed(digits);
}

export default function VideoWithStartEnd({ previewUrl, onTime }) {
    const videoRef = useRef(null);
    const [duration, setDuration] = useState(0);

    const [start, setStart] = useState(0);
    const [end, setEnd] = useState(0);
    const [errorMessage, setErrorMessage] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    // For debounced seeking on mobile
    const seekTimeoutRef = useRef(null);
    const [isSeeking, setIsSeeking] = useState(false);

    // Reset times when previewUrl changes
    useEffect(() => {
        setDuration(0);
        setStart(0);
        setEnd(0);
    }, [previewUrl]);

    useEffect(() => {
        onTime(start, end);
    }, [start, end, onTime]);

    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;

        const onLoadedMetadata = () => {
            const d = Number.isFinite(v.duration) ? v.duration : 0;
            if (d > 0) {
                setDuration(d);
                setEnd(d);
                setStart(0);
            }
        };

        const onDurationChange = () => {
            const d = Number.isFinite(v.duration) ? v.duration : 0;
            if (d > 0) {
                setDuration(d);
                setEnd((prev) => (prev === 0 ? d : Math.min(prev, d)));
            }
        };

        const onCanPlay = () => {
            // Video is ready to play
        };

        const onError = (e) => {
            console.error("Video error:", v.error?.code, v.error?.message);
            // Show that there was an error loading the video
            setErrorMessage("Error loading video preview.");
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

    // Cleanup seek timeout on unmount
    useEffect(() => {
        return () => {
            if (seekTimeoutRef.current) {
                clearTimeout(seekTimeoutRef.current);
            }
        };
    }, []);

    // Debounced seek with seeked event - fixes frame preview on mobile
    const jumpVideo = useCallback((t) => {
        const v = videoRef.current;
        if (!v) return;
        
        // Clear any pending seek
        if (seekTimeoutRef.current) {
            clearTimeout(seekTimeoutRef.current);
        }
        
        // Debounce seeks (50ms delay) to prevent overwhelming mobile browsers
        seekTimeoutRef.current = setTimeout(() => {
            if (isSeeking) return;
            setIsSeeking(true);
            
            const onSeeked = () => {
                v.removeEventListener('seeked', onSeeked);
                setIsSeeking(false);
            };
            
            v.addEventListener('seeked', onSeeked);
            v.currentTime = t;
            
            // Fallback: clear seeking state after timeout in case seeked doesn't fire
            setTimeout(() => {
                if (isSeeking) {
                    setIsSeeking(false);
                }
            }, 1000);
        }, 50);
    }, [isSeeking]);

    // Only clamp the value being changed. Do NOT alter the other slider’s range/props.
    const onStartChange = (e) => {
        const raw = Number(e.target.value);
        const next = Math.max(0, Math.min(raw, end)); // 0 ≤ start ≤ end
        setStart(next);
        jumpVideo(next);
    };

    const onEndChange = (e) => {
        const raw = Number(e.target.value);
        const next = Math.max(start, Math.min(raw, duration)); // start ≤ end ≤ duration
        setEnd(next);
        jumpVideo(next);
    };

    return (
        <div className="w-full">
            <div className="flex-1 flex items-center justify-center">
                <video
                    ref={videoRef}
                    className="max-h-64 w-full rounded-2xl ring-1 ring-white/10 object-contain"
                    src={previewUrl}
                    crossOrigin="anonymous"
                    playsInline
                    muted
                    preload="auto"
                />
            </div>

            {/* Dropdown for trim controls */}
            <div className="mt-4">
                <button
                    onClick={() => {
                        if (isDropdownOpen) {
                            setIsDropdownVisible(false);
                            setTimeout(() => setIsDropdownOpen(false), 300);
                        } else {
                            setIsDropdownOpen(true);
                            setIsDropdownVisible(true);
                        }
                    }}
                    className={`w-full px-4 py-3 rounded-lg border border-white/30 bg-white/5 hover:bg-white/10 backdrop-blur-md text-white/90 font-medium shadow-md transition-all duration-200 flex items-center justify-between hover:border-white/50 ${!isDropdownOpen ? 'blink-dropdown' : ''}`}
                >
                    <span className="flex items-center gap-2">
                        <span>Trim for accurate results</span>
                    </span>
                    <span
                        className={`transition-transform duration-300 text-white/60 ${
                            isDropdownOpen ? "rotate-180" : ""
                        }`}
                    >
                        ▼
                    </span>
                </button>

                {/* Dropdown Content */}
                {isDropdownOpen && (
                    <div className={`mt-3 p-4 rounded-lg border border-white/20 bg-white/5 backdrop-blur-md shadow-lg space-y-4 ${isDropdownVisible ? 'dropdown-slide-down' : 'dropdown-slide-up'}`}>
                        {/* Readout */}
                        <div className="flex justify-between text-xs text-white/80 tabular-nums">
                            <span>Start: {formatTime(start)}</span>
                            <span>End: {formatTime(end || duration)}</span>
                        </div>

                        {/* Start Slider */}
                        <Slider
                            min={0}
                            max={duration || 0}
                            value={start}
                            onChange={onStartChange}
                            text="Start"
                        />

                        {/* End Slider */}
                        <Slider
                            min={0}
                            max={duration || 0}
                            value={end}
                            onChange={onEndChange}
                            text="End"
                        />

                        {/* visualization of selected window */}
                        <VisualizationSlider start={start} end={end} duration={duration} />
                    </div>
                )}
            </div>
        </div>
    );
}

function Slider({ min, max, value, onChange, text }) {
    return (
        <div className="mt-4 py-2">
            <div className="mb-1 flex justify-between text-[11px] text-white/70">
                <span>{text}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step="0.01"
                value={value}
                onChange={onChange}
                className="w-full h-6 rounded-full bg-white/10 accent-white/80 focus:outline-none focus-visible:ring-2 cursor-pointer
                           [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5
                           [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5"
                style={{ touchAction: 'manipulation' }}
            />
        </div>
    )
}

function VisualizationSlider({ start, end, duration }) {
    return (
        <div className="relative mt-3 h-2 rounded-full bg-white/10">
            <div
                className="absolute top-0 h-2 rounded-full bg-white/30"
                style={{
                    left: duration ? `${(start / duration) * 100}%` : "0%",
                    width:
                        duration && end >= start
                            ? `${((end - start) / duration) * 100}%`
                            : "0%",
                }}
            />
        </div>
    )
}