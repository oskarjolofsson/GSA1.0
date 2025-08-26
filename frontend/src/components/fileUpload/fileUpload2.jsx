import { useState, useRef, useEffect } from "react";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // cleanup preview URL
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 30);
    return () => clearTimeout(t);
  }, []);

  function onSelect(files) {
    if (!files || !files.length) return;
    const f = files[0];
    if (!f.type.startsWith("video/")) {
      alert("Please select a video file.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  function onDrop(e) {
    e.preventDefault();
    setDragActive(false);
    if (file) return; // max one file
    onSelect(e.dataTransfer.files);
  }

  function onRemove() {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function onUpload() {
    if (!file) return;
    // stubbed upload; replace with your API endpoint
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("http://localhost:8000/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      alert("Uploaded! " + (data.message || ""));
    } catch (err) {
      alert("Could not upload. Check backend.");
    }
  }

  return (
    <div className="bg-[#0b1020] text-slate-100 relative overflow-hidden py-12 min-h-screen">
      {/* topo + gradient background (same vibe as hero) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: "url('/icons/topography.svg')",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'top left',
          backgroundSize: '1200px',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent to-white/10" />

      <section className="relative mx-auto max-w-6xl px-4 mt-16">
        <header className="mb-12 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">Upload & Get Feedback</h1>
          <p className="mt-4 text-slate-400">Drop a single video below. We’ll analyze it and return insights.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); if (!file) setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            className={`rounded-3xl border-2 border-dashed p-10 text-center backdrop-blur-md shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] transition-all duration-700 ease-out will-change-transform transform ${ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${
              dragActive ? 'border-emerald-400 bg-emerald-400/5' : 'border-white/10 bg-[#0e1428]/70'
            }`}
          >
            <input
              ref={inputRef}
              id="video-input"
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => { if (!file) onSelect(e.target.files); }}
            />

            <label htmlFor="video-input" className="cursor-pointer block">
              <div className="mx-auto grid place-items-center h-14 w-14 rounded-full bg-white/5 ring-1 ring-white/10">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              </div>
              <p className="mt-6 text-slate-200 font-semibold">Drop your video here or click to browse</p>
              <p className="text-sm text-slate-400 mt-1">Max one file • MP4, MOV, etc.</p>
            </label>

            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-xl bg-white/5 px-5 py-2 ring-1 ring-white/10 hover:bg-white/10"
                disabled={!!file}
              >
                Choose file
              </button>
              <button
                type="button"
                onClick={onUpload}
                disabled={!file}
                className="rounded-xl bg-emerald-500/90 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-2 font-semibold"
              >
                Upload
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className={`rounded-3xl bg-[#0e1428]/80 backdrop-blur-md border border-white/10 p-6 min-h-[280px] flex items-center justify-center transition-all duration-700 ease-out will-change-transform transform ${ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} delay-150`}>
            {!previewUrl ? (
              <div className="text-slate-400 text-sm">No video selected</div>
            ) : (
              <div className="w-full h-full flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                  <video
                    className="max-h-64 w-full rounded-2xl ring-1 ring-white/10 object-contain"
                    src={previewUrl}
                    controls
                  />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-slate-400 truncate">{file?.name}</div>
                  <button
                    type="button"
                    onClick={onRemove}
                    className="inline-flex items-center gap-1 rounded-xl bg-white/5 px-3 py-1.5 text-sm ring-1 ring-white/10 hover:bg-white/10"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg>
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
