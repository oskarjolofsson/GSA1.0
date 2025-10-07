

export default function DropZone({
  file,
  dragActive,
  setDragActive,
  ready,
  inputRef,
  onDrop,
  onSelect,
  onUpload,
  uploading,
  tokenCount,
}) {
  function handleDragOver(e) {
    e.preventDefault();
    if (!file) setDragActive(true);
  }

  function handleChange(e) {
    if (!file) onSelect(e.target.files);
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={() => setDragActive(false)}
      onDrop={onDrop}
      className={`rounded-3xl border-2 border-dashed p-10 text-center backdrop-blur-md shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] transition-all duration-700 ease-out will-change-transform transform ${
        ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${dragActive ? "border-emerald-400 bg-emerald-400/5" : "border-white/10 bg-[#0e1428]/70"}`}
    >
      <input
        ref={inputRef}
        id="video-input"
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleChange}
      />

      <label htmlFor="video-input" className="cursor-pointer block">
        <div className="mx-auto grid place-items-center h-14 w-14 rounded-full bg-white/5 ring-1 ring-white/10">
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
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
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-300 mr-2">
            <span className="font-medium inline-flex items-center gap-1">
            <span
              role="img"
              aria-label="Token"
              className="inline-block h-4 w-4 bg-emerald-500"
              style={{
                WebkitMask: 'url(/icons/token.svg) no-repeat center / contain',
                mask: 'url(/icons/token.svg) no-repeat center / contain',
              }}
            />
            {tokenCount ?? '—'}
            </span>
          </div>
          <button
            type="button"
            onClick={onUpload}
            disabled={!file || uploading}
            className="rounded-xl bg-emerald-500/90 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 font-semibold"
            aria-busy={uploading}
          >
            {uploading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white/90"></span>
                Uploading...
              </span>
            ) : (
              "Upload"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}