import { useRef, useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL;


async function trimVideo(file, start, end) {
  const formData = new FormData();
  formData.append('video', file);   // file is a File object (e.g. from <input type="file">)
  formData.append('start', start);  // e.g. "5.3" or "00:00:05.3"
  formData.append('end', end);      // e.g. "10.0"

  const response = await fetch(`${API}/api/v1/edit/trim_video`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server error (${response.status})`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  return { new_url: url, new_file: blob}
}


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

            // fetch backend to trim the video
            let { new_url, new_file } = await trimVideo(file, start, end);
            
            console.log("Trimmed file:", new_file);
            console.log("Old file:", file);

            onTrimmed?.(new_file, new_url);
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
