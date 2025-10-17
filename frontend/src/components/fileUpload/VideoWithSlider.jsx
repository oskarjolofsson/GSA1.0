import { useEffect, useRef, useState } from "react";

function formatTime(s, digits = 2) {
    if (!Number.isFinite(s)) return "0.00";
    return s.toFixed(digits);
}

export default function VideoWithStartEnd({ previewUrl }) {
    const videoRef = useRef(null);
    const [duration, setDuration] = useState(0);
    const [current, setCurrent] = useState(0);

    const [start, setStart] = useState(0);
    const [end, setEnd] = useState(0);

    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;

        const onLoaded = () => {
            const d = Number.isFinite(v.duration) ? v.duration : 0;
            setDuration(d);
            setEnd((prev) => (prev === 0 ? d : Math.min(prev, d)));
            setStart((prev) => Math.max(0, Math.min(prev, d)));
        };
        const onTime = () => setCurrent(v.currentTime || 0);

        v.addEventListener("loadedmetadata", onLoaded);
        v.addEventListener("durationchange", onLoaded);
        v.addEventListener("timeupdate", onTime);
        return () => {
            v.removeEventListener("loadedmetadata", onLoaded);
            v.removeEventListener("durationchange", onLoaded);
            v.removeEventListener("timeupdate", onTime);
        };
    }, []);

    const jumpVideo = (t) => {
        const v = videoRef.current;
        if (!v) return;
        v.currentTime = t;
        setCurrent(t);
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
                    controls
                />
            </div>

            {/* Readout */}
            <div className="mt-3 grid grid-cols-3 text-xs text-white/80 tabular-nums">
                <span>Start: {formatTime(start)}</span>
                <span className="text-center">Now: {formatTime(current)}</span>
                <span className="text-right">End: {formatTime(end || duration)}</span>
            </div>

            {/* Start Slider (fixed range 0..duration) */}
            <div className="mt-4">
                <div className="mb-1 flex justify-between text-[11px] text-white/70">
                    <span>Start</span>
                    <span>{formatTime(start)}</span>
                </div>
                <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step="0.01"
                    value={start}
                    onChange={onStartChange}
                    className="w-full h-2 rounded-full bg-white/10 accent-white/80 focus:outline-none focus-visible:ring-2"
                />
            </div>

            {/* End Slider (fixed range 0..duration) */}
            <div className="mt-4">
                <div className="mb-1 flex justify-between text-[11px] text-white/70">
                    <span>End</span>
                    <span>{formatTime(end || duration)}</span>
                </div>
                <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step="0.01"
                    value={end}
                    onChange={onEndChange}
                    className="w-full h-2 rounded-full bg-white/10 accent-white/80 focus:outline-none focus-visible:ring-2"
                />
            </div>

            {/* Optional visualization of selected window */}
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
        </div>
    );
}
