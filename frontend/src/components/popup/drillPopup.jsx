import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, Loader } from "lucide-react";

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

function getPopupSize() {
  const padding = 24; // space from viewport edges
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const minSide = Math.min(vw, vh);

  // Desired size is "absolute" (px) but responsive and never outside screen:
  const desired = clamp(Math.round(minSide * 0.9), 280, 760);
  const maxAllowed = Math.max(220, minSide - padding * 2); // guarantee fit
  return Math.min(desired, maxAllowed);
}

export default function DrillPopup({
  drill,
  image,
  onClose,
  isLoading,
  isTimeout,
}) {
  const [entered, setEntered] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [popupSize, setPopupSize] = useState(() => getPopupSize());
  const closeTimerRef = useRef(null);

  const isOpen = Boolean(drill);

  // Keep size correct on resize / orientation change
  useEffect(() => {
    if (!isOpen) return;

    const onResize = () => setPopupSize(getPopupSize());
    onResize();

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [isOpen]);

  // Enter/exit animation trigger
  useEffect(() => {
    if (isOpen) {
      setExiting(false);
      requestAnimationFrame(() => setEntered(true));
    } else {
      setEntered(false);
      setExiting(false);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (!isOpen) return;
    setEntered(false);
    setExiting(true);

    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      onClose?.();
    }, 260);
  }, [isOpen, onClose]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-6 py-6 transition-colors duration-300 ${
        entered && !exiting ? "bg-black/60" : "bg-black/0"
      }`}
      onMouseDown={(e) => {
        // close only if click is on backdrop (not inside modal)
        if (e.target === e.currentTarget) handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Drill popup"
    >
      <div
        className={`relative transform transition-all duration-300 ease-out ${
          entered && !exiting
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-3 scale-[0.98]"
        }`}
        style={{ width: popupSize, height: popupSize }}
      >
        {/* Card */}
        <div className="relative h-full w-full overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/10 bg-slate-900">
          {/* Image / State layer */}
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
              <div className="flex flex-col items-center gap-3">
                <Loader size={44} className="animate-spin text-white/90" />
                <p className="text-white/90 text-base">Loading drill image…</p>
              </div>
            </div>
          ) : isTimeout ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
              <div className="flex flex-col items-center gap-2 text-center px-6">
                <p className="text-red-300 text-base font-semibold">
                  Failed to load image
                </p>
                <p className="text-slate-300 text-sm">
                  The image took too long to load. Please try again.
                </p>
              </div>
            </div>
          ) : image ? (
            <img
              src={image}
              alt={drill ? `Drill: ${drill}` : "Drill"}
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
              <p className="text-white/90 text-base">No image available</p>
            </div>
          )}

          {/* Soft vignette + title overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          {/* Title (glass) */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="backdrop-blur-md bg-black/35 border border-white/10 rounded-2xl px-4 py-3">
              <h2 className="text-white text-lg sm:text-xl font-semibold leading-tight">
                {drill}
              </h2>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 inline-flex items-center justify-center rounded-full bg-black/35 backdrop-blur-md border border-white/10 text-white/90 hover:text-white hover:bg-black/50 transition h-10 w-10"
            aria-label="Close"
          >
            X
          </button>
        </div>
      </div>
    </div>
  );
}
