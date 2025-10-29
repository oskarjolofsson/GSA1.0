import React, { useEffect, useState } from "react";

export default function MessagePopup({ message, onClose }) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pointer-events-none"
      aria-live="polite"
    >
      <div className="mt-24 w-full max-w-xl pointer-events-auto px-4">
        <div
          className={`rounded-2xl bg-white text-gray-900 border border-gray-200 p-4 shadow-xl transform transition-all duration-300 ease-out
            ${entered && !exiting ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm">
              {message}
            </div>
            <button
              onClick={handleClose}
              className="ml-3 inline-flex items-center justify-center rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
