import * as MP4Box from "mp4box";
import { useRef, useState, useEffect } from "react";

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

    const onChangeStart = (e) => {
        const v = Number(e.target.value);
        setStart(clamp(isNaN(v) ? 0 : v, 0, Math.max(0, end - 0.1)));
    };

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
            const outFile = await trimMp4(file, start, end);
            onTrimmed?.(outFile);
            // Close the popup
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

async function trimMp4(file, startSec, endSec, outName = 'trim.mp4') {
    if (!(startSec >= 0) || !(endSec > startSec)) {
        throw new Error('Invalid range');
    }

    const mp4box = MP4Box.createFile();
    const chunks = [];

    // --- Promise to resolve when segmentation finishes ---
    let doneResolve, doneReject;
    const done = new Promise((res, rej) => { doneResolve = res; doneReject = rej; });

    mp4box.onError = e => {
        mp4box.onError = (e) => doneReject(new Error("mp4box error: " + e));
    };

    mp4box.onReady = (info) => {
        // 1) ask for keyframe-aligned segments
        info.tracks.forEach(t =>
            mp4box.setSegmentOptions(t.id, null, { rapAlignement: true })
        );

        // 2) push init segments first
        const initSegs = mp4box.initializeSegmentation();
        initSegs?.forEach(seg => seg?.buffer && chunks.push(seg.buffer));

        // 3) seek to start (seconds) and start processing
        mp4box.seek(startSec, true);
        mp4box.start();

        // 4) mark stopping point (seconds). We'll flush after feeding is done.
        mp4box.seek(endSec, true);
    };

    // (id, user, buffer, sampleNum, isLast)
    mp4box.onSegment = (id, user, buffer, _n, isLast) => {
        if (buffer?.byteLength) {
            chunks.push(buffer);
        }
        if (isLast) {
            try {
                if (!chunks.length) {
                    throw new Error("No output produced");
                }

                // Calculate total space
                const total = chunks.reduce((n, b) => n + b.byteLength, 0);
                // Take up 'total' space
                const out = new Uint8Array(total);

                // assign data to out-space
                let off = 0;
                for (const b of chunks) {
                    out.set(new Uint8Array(b), off); off += b.byteLength;
                }

                // Remake into usable file
                const blob = new Blob([out], { type: "video/mp4" });
                const fileOut = new File([blob], outName, { type: "video/mp4" });

                doneResolve(fileOut);
            } catch (err) {
                doneReject(err);
            }
        }
    };

    // 5) feed data in chunks
    await feedFileInChunks(file, mp4box);

    // 6) signal end-of-input once
    mp4box.flush();

    // 7) wait for last segment to arrive and the file to be built
    return done;
}

async function feedFileInChunks(file, mp4box, chunkSize = 2 * 1024 * 1024) { // 2 MB chunks
    // Parser variable to keep track of which chunk to parse
    let offset = 0;

    while (offset < file.size) {
        // Chunch to be added next to ab
        const slice = file.slice(offset, offset + chunkSize);
        // remake slice into binary data in memory
        const ab = await slice.arrayBuffer();
        ab.fileStart = offset;
        mp4box.appendBuffer(ab);
        offset += chunkSize;
    }
}