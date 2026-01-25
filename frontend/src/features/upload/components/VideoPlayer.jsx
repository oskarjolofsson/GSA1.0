import { Trash2 } from "lucide-react";

export default function VideoPlayer({ videoRef, previewUrl, onRemove }) {
  return (
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
  );
}
