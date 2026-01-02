import { useEffect, useRef, useState, useCallback } from "react";
import { Scissors, Trash2, ArrowRight } from "lucide-react";
import { Range } from "react-range";
import Dropdown from "../../Dropdown";
import { useValidation } from "../../../../context/ValidationContext";

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

export default function VideoWithStartEnd({ previewUrl, onTime, onRemove, onTrimClose = null }) {
    const videoRef = useRef(null);
    const dropdownRef = useRef(null);
    const validation = useValidation();
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

    // Validation logic: Check if video needs trimming or is too long
    useEffect(() => {
        const trimmedLength = Math.max(0, end - start);

        // If video is longer than 5 seconds
        if (duration > 5) {
            // If not trimmed (start and end are at default), show trim error
            if (start === 0 && end === duration) {
                validation.setValidationError('trim', 'Video must be trimmed before upload');
            } else {
                validation.clearValidationError('trim');
            }

            // If trimmed video is longer than 5 seconds, show duration error
            if (trimmedLength > 5) {
                validation.setValidationError('duration', 'Trimmed video must be ≤ 5 seconds');
            } else {
                validation.clearValidationError('duration');
            }
        } else {
            // Video is short enough, clear all validation errors
            validation.clearValidationError('trim');
            validation.clearValidationError('duration');
        }
    }, [start, end, duration, validation]);

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

        // Debounce seeks (16ms delay) to prevent overwhelming mobile browsers
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
        }, 16);
    }, [isSeeking]);

    // Handle range slider change with both handles
    const onRangeChange = useCallback((values) => {
        const prevStart = start;
        const prevEnd = end;

        setStart(values[0]);
        setEnd(values[1]);

        // Jump to whichever handle moved
        if (Math.abs(values[0] - prevStart) > Math.abs(values[1] - prevEnd)) {
            // Start handle moved
            jumpVideo(values[0]);
        } else {
            // End handle moved
            jumpVideo(values[1]);
        }
    }, [jumpVideo, start, end]);

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

            {/* Helpful tip for first-time users */}
            <div className="mt-3 text-center">
                <p className="text-xs text-white/60">
                    Tip: Trim the video so only the swing motion remains.
                </p>
            </div>

            {/* Dropdown for trim controls */}
            <div className="mt-4">
                <Dropdown
                    ref={dropdownRef}
                    icon={<Scissors className="w-4 h-4 text-white/70" />}
                    name="Step 1: Trim Your Swing"
                    isStep1={true}
                    isInitiallyOpen={true}
                    onClose={onTrimClose}
                    done={duration > 0 && Math.max(0, end - start) <= 5}
                    requirement={"Video too long, please trim"}
                >
                    {/* Helper text */}
                    <div className="text-xs text-white/60 mb-3">
                        Select only the swing motion. This is required for accurate analysis.
                    </div>

                    {/* Dual-handle Range Slider */}
                    <div className="mt-4 px-2">
                        <Range
                            step={0.01}
                            min={0}
                            max={Math.max(duration, 0.01)}
                            values={[start, end]}
                            onChange={onRangeChange}
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
                                        {/* Filled track between handles  */}
                                        <div
                                            className={`absolute h-2 rounded-full ${Math.max(0, end - start) > 5 ? 'bg-red-500/60' : 'bg-emerald-500/60'
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
                                // Determine label position to keep it within bounds
                                let labelAlignment = "center";
                                if (percentage < 15) {
                                    labelAlignment = "left";
                                } else if (percentage > 85) {
                                    labelAlignment = "right";
                                }

                                return (
                                    <div
                                        {...props}
                                        className="relative "
                                        style={{
                                            ...props.style,
                                        }}
                                    >
                                        <div
                                            className={`h-5 w-5 rounded-full transition-colors ${isDragged
                                                ? "bg-white shadow-lg shadow-white/50"
                                                : "bg-white/80 hover:bg-white"
                                                }`}
                                            style={{
                                                boxShadow: isDragged ? "0 0 8px rgba(255, 255, 255, 0.5)" : "none",
                                            }}
                                        />
                                        {/* Value label underneath thumb */}
                                        <div
                                            className="absolute left-1/2 -translate-x-1/2 top-full mt-1 text-xs font-semibold text-white/90 whitespace-nowrap pointer-events-none"
                                        >
                                            {formatTime(value)}
                                        </div>
                                    </div>
                                );
                            }}
                        />
                    </div>



                    {/* Trimmed length display and recommendation */}
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                        <div className="flex justify-between items-center text-xs text-white/80">
                            <span className="font-medium">Total length of trimmed video:</span>
                            <span className={`font-semibold ${Math.max(0, end - start) > 5 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {formatTime(Math.max(0, end - start))}
                            </span>
                        </div>
                        <div className="text-xs text-white/50">
                            Recommended length: 2 to 3 seconds. Must be ≤ 5 seconds.
                        </div>
                    </div>

                    {/* Next button */}
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={() => {
                                if (dropdownRef.current) {
                                    dropdownRef.current.close();
                                }
                                if (onTrimClose) {
                                    onTrimClose();
                                }
                            }}
                            disabled={Math.max(0, end - start) > 5}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/90 hover:bg-emerald-500 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Confirm Trim
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </Dropdown>
            </div>
        </div>
    );
}