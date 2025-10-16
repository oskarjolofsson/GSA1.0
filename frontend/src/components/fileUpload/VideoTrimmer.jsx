import { useRef, useState, useEffect } from "react";
import { trimVideo } from "./TrimMp4.js";

export default function VideoTrimmer2({ file, onCancel, onTrimmed }) {
    const videoRef = useRef(null);
    const [url, setUrl] = useState("");
    const [duration, setDuration] = useState(0);
    const [start, setStart] = useState(0);
    const [end, setEnd] = useState(0);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    // create object URL for preview
    useEffect(() => {
        if (!file) return;
        const u = URL.createObjectURL(file);
        setUrl(u);
        return () => URL.revokeObjectURL(u);
    }, [file]);

    // initialize end once metadata is loaded
    const handleLoaded = () => {
        if (!videoRef.current) return;
        const d = videoRef.current.duration || 0;
        setDuration(d);
        setEnd(prev => (prev > 0 ? prev : Math.floor(d)));
    };

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    // User sets start-time
    const onChangeStart = (e) => {
        const v = Number(e.target.value);
        setStart(clamp(isNaN(v) ? 0 : v, 0, Math.max(0, end - 0.1)));
    };

    // User sets end-time
    const onChangeEnd = (e) => {
        const v = Number(e.target.value);
        setEnd(clamp(isNaN(v) ? 0 : v, start + 0.1, duration || 10_000));
    };

    const secondsLabel = (s) => (Number.isFinite(s) ? s.toFixed(2) + "s" : "—");

    async function handleTrim() {
        setErr("");
        setBusy(true);
        try {
            if (!file) throw new Error("No file provided");

            console.log("Video length: ", duration, "s. Trimming to:", start, "-", end, "s");

            const { new_blob, new_url } = await trimVideo(file, start, end);

            console.log("Trimmed file:", new_blob);
            console.log("Old file:", file);

            onTrimmed?.(new_blob, new_url);
            onCancel?.();
        } catch (e) {
            console.error(e);
            setErr(e?.message || String(e));
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b p-4">
                    <h2 className="text-lg font-semibold">Trim video</h2>
                    <button className="rounded-full p-2 hover:bg-black/5" onClick={onCancel} aria-label="Close">✕</button>
                </div>

                <div className="grid gap-4 p-4 md:grid-cols-2">
                    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
                        {url && (
                            <video
                                ref={videoRef}
                                src={url}
                                className="h-full w-full"
                                controls
                                onLoadedMetadata={handleLoaded}
                            />
                        )}
                    </div>

                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium">Start (s)</label>
                            <input
                                type="number"
                                step="0.1"
                                min={0}
                                max={Math.max(0, end - 0.1)}
                                value={start}
                                onChange={onChangeStart}
                                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">End (s)</label>
                            <input
                                type="number"
                                step="0.1"
                                min={start + 0.1}
                                max={duration || undefined}
                                value={end}
                                onChange={onChangeEnd}
                                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring"
                            />
                        </div>

                        <div className="text-sm text-gray-600">
                            <div>Duration: <strong>{secondsLabel(duration)}</strong></div>
                            <div>Selection: <strong>{secondsLabel(end - start)}</strong></div>
                        </div>

                        {err && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                {err}
                            </div>
                        )}

                        <div className="mt-auto flex gap-3">
                            <button
                                onClick={onCancel}
                                className="rounded-xl border px-4 py-2 font-medium hover:bg-black/5 disabled:opacity-50"
                                disabled={busy}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleTrim}
                                className="rounded-xl bg-black px-4 py-2 font-semibold text-white hover:opacity-90 disabled:opacity-50"
                                disabled={busy || end <= start}
                            >
                                {busy ? "Trimming…" : "Trim & Save"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
