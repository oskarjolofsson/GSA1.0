

export default function UploadButtonZone({ onUpload, uploading, tokenCount }) {
    return (
        <div className="flex items-center justify-center gap-3 mt-6">
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
                className="rounded-xl bg-emerald-500/90 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 font-semibold"
                aria-busy={uploading}
                disabled={uploading}
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

    )
}