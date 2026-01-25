import { useValidation } from "../../context/ValidationContext";

export default function UploadButtonZone({ onUpload, uploading }) {
    const validation = useValidation();
    const hasValidationErrors = validation.hasErrors();
    const errorMessage = validation.getFirstErrorMessage();

    return (
        <div className="flex items-center justify-center gap-3 mt-6">
            <div className="relative group">
                <button
                    type="button"
                    onClick={onUpload}
                    className="rounded-xl bg-emerald-500/90 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 font-semibold transition-colors"
                    aria-busy={uploading}
                    disabled={uploading || hasValidationErrors}
                    title={hasValidationErrors ? errorMessage : undefined}
                >
                    {uploading ? (
                        <span className="inline-flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white/90"></span>
                            Uploading...
                        </span>
                    ) : (
                        "Start Analysis"
                    )}
                </button>
                
                {/* Tooltip showing validation error */}
                {hasValidationErrors && !uploading && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-red-500/90 text-white text-xs rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                        {errorMessage}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-red-500/90"></div>
                    </div>
                )}
            </div>
        </div>
    );
}