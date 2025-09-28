import React, { useEffect, useState } from 'react';

export default function ErrorPopup({ message, onClose }) {
  const [entered, setEntered] = useState(false);
  const [exiting, setExiting] = useState(false);

  // When message changes (new error), reset animation state and enter
  useEffect(() => {
    if (message) {
      setExiting(false);
      // small timeout to allow initial render before animating
      requestAnimationFrame(() => setEntered(true));
    } else {
      setEntered(false);
      setExiting(false);
    }
  }, [message]);

  if (!message) return null;

  function handleClose() {
    // play exit animation, then call parent's onClose after duration
    setExiting(true);
    setEntered(false);
    const D = 300; // match duration below (ms)
    setTimeout(() => onClose && onClose(), D);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pointer-events-none" aria-live="assertive">
      <div className="mt-24 w-full max-w-xl pointer-events-auto px-4">
        <div
          className={`rounded-2xl border-2 border-red-400 bg-[#2b0f0f]/95 text-white p-4 shadow-lg transform transition-all duration-300 ease-out
            ${entered && !exiting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-red-500/90 grid place-items-center">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v4m0 4h.01" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10.29 3.86 1.82 12.34a2 2 0 0 0 1.42 3.41h16.52a2 2 0 0 0 1.42-3.41L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <div className="flex-1">
              <div className="text-sm font-semibold">Upload failed</div>
              <div className="mt-1 text-xs text-red-100 break-words">{message}</div>
            </div>

            <div className="ml-3 flex-shrink-0">
              <button
                onClick={handleClose}
                className="inline-flex items-center justify-center rounded-md bg-white/5 px-3 py-1 text-sm text-white/90 hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
