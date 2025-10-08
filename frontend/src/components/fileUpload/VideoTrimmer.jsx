import { useState, useEffect, useRef } from "react";

export default function VideoTrimmer({ file, onCancel, onTrimmed }) {
  const [ffmpeg, setFfmpeg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(null);
  const [duration, setDuration] = useState(null);

  const fetchFileRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      // dynamic import to avoid bundler export problems
      const mod = await import("@ffmpeg/ffmpeg");
      const { createFFmpeg, fetchFile } = mod;
      fetchFileRef.current = fetchFile;
      const ff = createFFmpeg({ log: true });
      setFfmpeg(ff);
      await ff.load();
      setReady(true);
    };
    load();
  }, []);

  useEffect(() => {
    if (!file) return;
    // get video duration via HTMLVideoElement
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.src = url;
    const onLoaded = () => {
      const d = v.duration || 0;
      setDuration(d);
      setEnd(d);
      URL.revokeObjectURL(url);
    };
    v.addEventListener("loadedmetadata", onLoaded);
    return () => v.removeEventListener("loadedmetadata", onLoaded);
  }, [file]);

  const formatTime = (s) => {
    if (!s && s !== 0) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const doTrim = async () => {
    if (!ffmpeg || !ready) return;
    // clamp
    const s = Math.max(0, Math.min(start, duration || 0));
    const e = Math.max(0, Math.min(end || (duration || 0), duration || 0));
    if (e <= s) {
      alert("End must be greater than start");
      return;
    }

    setLoading(true);
    try {
      const name = file.name || "input.mp4";
      const inName = "in" + name.replace(/[^a-z0-9.]/gi, "_");
      const outName = "out_" + inName;

  // write file to FS
  if (!fetchFileRef.current) throw new Error("fetchFile not available");
  ffmpeg.FS("writeFile", inName, await fetchFileRef.current(file));

      // run ffmpeg trim: -ss start -to end -c copy
      // using -ss and -to with copy is fast but may be imprecise; acceptable for simple trims
      await ffmpeg.run("-ss", `${s}`, "-i", inName, "-to", `${e - s}`, "-c", "copy", outName);

      const data = ffmpeg.FS("readFile", outName);
      const blob = new Blob([data.buffer], { type: file.type || "video/mp4" });
      const trimmedFile = new File([blob], file.name || "trimmed.mp4", { type: file.type || "video/mp4" });

      // cleanup
      try {
        ffmpeg.FS("unlink", inName);
        ffmpeg.FS("unlink", outName);
      } catch (e) {}

      onTrimmed(trimmedFile);
    } catch (err) {
      console.error(err);
      alert("Trimming failed: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#0e1428] rounded-2xl p-6 w-full max-w-3xl h-[80vh] overflow-auto text-slate-100">
        <h3 className="text-lg font-semibold mb-4">Trim video length</h3>
        <div className="mb-4">
          <div className="mb-2 text-sm text-slate-300">Preview</div>
          <video src={URL.createObjectURL(file)} controls className="w-full rounded-md max-h-[40vh] object-contain" />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <label className="text-sm text-slate-300">Start ({formatTime(start)})
            <input type="range" min="0" max={duration || 0} step="0.1" value={start} onChange={(e) => setStart(parseFloat(e.target.value))} className="w-full" />
          </label>
          <label className="text-sm text-slate-300">End ({formatTime(end)})
            <input type="range" min="0" max={duration || 0} step="0.1" value={end || 0} onChange={(e) => setEnd(parseFloat(e.target.value))} className="w-full" />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-400">Duration: {duration ? formatTime(duration) : '—'}</div>
          <div className="flex items-center gap-2">
            <button onClick={onCancel} className="rounded-xl bg-white/5 px-4 py-2 text-sm hover:bg-white/10">Cancel</button>
            <button onClick={doTrim} disabled={!ready || loading} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm text-white disabled:opacity-50">
              {loading ? 'Trimming...' : 'Trim'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
