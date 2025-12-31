import { useEffect, useRef, useState, useCallback } from "react";
import { Scissors, Trash2 } from "lucide-react";
import Dropdown from "../Dropdown";

// Add keyframe animations for blinking and sliding
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse-border {
    0%, 100% { border-color: rgba(255, 255, 255, 0.3); }
    70% { border-color: rgba(255, 255, 255, 1); }
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

export default function VideoWithStartEnd({ previewUrl, onTime, onRemove}) {
    const videoRef = useRef(null);
    const [duration, setDuration] = useState(0);

    const [start, setStart] = useState(0);
    const [end, setEnd] = useState(0);
    const [errorMessage, setErrorMessage] = useState("");
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
            <div className="flex items-center justify-center">
                <div className="relative inline-block">
                    <video
                        ref={videoRef}
                        className="max-h-64 rounded-2xl ring-1 ring-white/10 object-contain border border-white/10 bg-black/30"
                        src={previewUrl}
                        crossOrigin="anonymous"
                        playsInline
                        muted
                        preload="auto"
                    />
                    {/* Delete button overlaid on bottom-right corner */}
                    {onRemove && (
                        <button
                            onClick={onRemove}
                            className="absolute bottom-3 right-3 px-3 py-2 rounded-lg bg-red-500/80 hover:bg-red-600 text-white shadow-lg transition-colors flex items-center gap-2"
                            title="Delete video"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>



            {/* Dropdown for trim controls */}
            <div className="mt-4">
                <Dropdown icon={<Scissors className="w-4 h-4 text-white/70" />} name="Trim for accurate results">
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
                </Dropdown>
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