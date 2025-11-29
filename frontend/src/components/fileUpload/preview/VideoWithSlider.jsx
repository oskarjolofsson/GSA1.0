import { useEffect, useRef, useState } from "react";
const API = import.meta.env.VITE_API_URL;

function formatTime(s, digits = 2) {
    if (!Number.isFinite(s)) return "0.00";
    return s.toFixed(digits);
}

export default function VideoWithStartEnd({ previewUrl, onTime }) {
    const videoRef = useRef(null);
    const [duration, setDuration] = useState(0);

    const [start, setStart] = useState(0);
    const [end, setEnd] = useState(0);

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

        const onLoaded = () => {
            const d = Number.isFinite(v.duration) ? v.duration : 0;
            if (d > 0) {
                setDuration(d);
                setEnd((prev) => (prev === 0 ? d : Math.min(prev, d)));
                setStart((prev) => Math.max(0, Math.min(prev, d)));
            }
        };
        
        const onCanPlay = () => {
            // Fallback for mobile devices that may not fire loadedmetadata
            if (v.duration && v.duration > 0) {
                onLoaded();
            }
        };
        const onPlay = () => {
            // Another fallback - when video starts playing
            if (v.duration && v.duration > 0) {
                onLoaded();
            }
        };

        v.addEventListener("loadedmetadata", onLoaded);
        v.addEventListener("durationchange", onLoaded);
        v.addEventListener("canplay", onCanPlay);
        v.addEventListener("play", onPlay);
        
        // Try to load metadata immediately if already available
        if (v.duration && v.duration > 0) {
            onLoaded();
        }
        
        return () => {
            v.removeEventListener("loadedmetadata", onLoaded);
            v.removeEventListener("durationchange", onLoaded);
            v.removeEventListener("canplay", onCanPlay);
            v.removeEventListener("play", onPlay);
        };
    }, [previewUrl]);

    const jumpVideo = (t) => {
        const v = videoRef.current;
        if (!v) return;
        v.currentTime = t;
    };

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
                />
            </div>

            {/* Readout */}
            <div className="flex justify-between text-xs text-white/80 tabular-nums mt-2">
                <span>Start: {formatTime(start)}</span>
                <span className="mt-3 inline-block px-4 py-1 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white/90 font-medium shadow-inner">
                    Trim for accurate results
                </span>
                <span>End: {formatTime(end || duration)}</span>
            </div>

            {/* Start Slider (fixed range 0..duration) */}
            <Slider
                min={0}
                max={duration || 0}
                value={start}
                onChange={onStartChange}
                text="Start"
            />

            {/* End Slider (fixed range 0..duration) */}
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
    );
}

function Slider({ min, max, value, onChange, text }) {
    return (
        <div className="mt-4">
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
                className="w-full h-2 rounded-full bg-white/10 accent-white/80 focus:outline-none focus-visible:ring-2"
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