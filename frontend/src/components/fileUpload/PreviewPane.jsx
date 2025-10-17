import VideoWithSlider from "./VideoWithSlider";

export default function PreviewPane({ previewUrl, ready, uploading, onRemove, file, note, setNote, onTime }) {
  return (
    <div
      className={`rounded-3xl bg-[#0e1428]/80 backdrop-blur-md border border-white/10 p-6 min-h-[280px] flex items-center justify-center transition-all duration-700 ease-out will-change-transform transform ${
        ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } delay-150`}
    >
      {!previewUrl ? (
        <div className="text-slate-400 text-sm">No video selected</div>
      ) : (
        <div className="w-full h-full flex flex-col">
          <VideoWithSlider previewUrl={previewUrl} onTime={onTime} />
          {/* Show a small text input only when a video is present */}
          {previewUrl && file?.type?.startsWith("video/") && (
            <div className="mt-4">
              <label htmlFor="preview-note" className="sr-only">Video note</label>
              <input
                id="preview-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a short note or caption..."
                className="w-full rounded-xl bg-white/5 ring-1 ring-white/10 px-4 py-2 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
              />
            </div>
          )}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-slate-400 truncate">{file?.name}</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onRemove}
                disabled={uploading}
                className="inline-flex items-center gap-1 rounded-xl bg-white/5 px-3 py-1.5 text-sm ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M6 6l12 12M18 6l-12 12" />
                </svg>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}