import React, { useState } from 'react';

export default function FeedbackBubble({ onOpenFeedback }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  function handleBubbleClick() {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      onOpenFeedback && onOpenFeedback();
    }
  }

  function handleMinimize() {
    setIsMinimized(true);
  }

  return (
    <div
      className={`transform transition-all duration-300 ease-out ${
        isMinimized
          ? 'fixed bottom-6 right-6 z-40'
          : 'fixed bottom-8 right-8 z-40'
      }`}
    >
      <div
        className={`transform transition-all duration-300 ease-out flex flex-col items-center gap-2 ${
          isMinimized ? 'scale-75 opacity-50' : 'scale-100 opacity-100'
        }`}
      >
        {/* Text and Button Container */}
        {!isMinimized && (
          <div className="flex items-center gap-3 bg-slate-800 rounded-full px-4 py-3 shadow-lg border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex-1">
              <p className="text-sm font-medium text-white whitespace-nowrap">
                Thoughts about True Swing?
              </p>
            </div>
            <button
              onClick={handleMinimize}
              className="ml-2 text-gray-400 hover:text-gray-200 transition-colors flex-shrink-0"
              aria-label="Minimize"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 12H4"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Clickable Bubble */}
        <button
          onClick={handleBubbleClick}
          className={`rounded-full shadow-lg transition-all duration-200 flex items-center justify-center hover:scale-110 ${
            isMinimized
              ? 'w-14 h-14 bg-blue-600 hover:bg-blue-700'
              : 'w-14 h-14 bg-blue-600 hover:bg-blue-700'
          }`}
        >
          <svg
            className="w-7 h-7 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 12a4 4 0 108 0 4 4 0 00-8 0z" />
            <path d="M12.88 20.04A9.96 9.96 0 005 12.5C5 6.81 9.58 2.5 15 2.5s10 4.31 10 10c0 .64-.05 1.28-.15 1.9M12 20.04v.02" />
          </svg>
        </button>
      </div>
    </div>
  );
}
