import React, { useEffect, useState } from "react";

export default function MessagePopup({ message, onClose, onConfirm }) {
  const [entered, setEntered] = useState(false);
  const [exiting, setExiting] = useState(false);

  // Animate in when a message is set
  useEffect(() => {
    if (message) {
      setExiting(false);
      requestAnimationFrame(() => setEntered(true));
    } else {
      setEntered(false);
      setExiting(false);
    }
  }, [message]);

  if (!message) return null;

  function handleClose() {
    setExiting(true);
    setEntered(false);
    const DURATION = 300;
    setTimeout(() => onClose && onClose(), DURATION);
  }

  function handleConfirm() {
    setExiting(true);
    setEntered(false);
    const DURATION = 300;
    setTimeout(() => onConfirm && onConfirm(), DURATION);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      aria-live="polite"
    >
      <div className="w-full max-w-xl pointer-events-auto px-4">
        <div
          className={`rounded-2xl bg-white text-gray-900 border border-gray-200 p-4 shadow-xl transform transition-all duration-300 ease-out
            ${entered && !exiting ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm">
              {message}
            </div>
            <div className="ml-3 flex gap-2 items-center">
              <button
                onClick={handleClose}
                className="inline-flex items-center justify-center rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 transition"
              >
                Close
              </button>
              {onConfirm && (
                <button
                  onClick={handleConfirm}
                  className="inline-flex items-center justify-center rounded-md bg-blue-500 px-3 py-1 text-xs font-medium text-white hover:bg-blue-600 transition"
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
