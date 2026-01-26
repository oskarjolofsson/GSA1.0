import React, { useEffect, useState, useRef } from 'react';
import FeedbackService from '../../../services/feedbackService.js';

export default function FeedbackPopup({ isOpen, onClose }) {
  const [entered, setEntered] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [selectedRating, setSelectedRating] = useState(null);
  const [explanation, setExplanation] = useState('');
  const textareaRef = useRef(null);

  // Trigger animation on open/close
  useEffect(() => {
    if (isOpen) {
      setExiting(false);
      requestAnimationFrame(() => setEntered(true));
    } else {
      setEntered(false);
      setExiting(false);
    }
  }, [isOpen]);

  // Auto-expand textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [explanation]);

  if (!isOpen) return null;

  function handleClose() {
    setExiting(true);
    setEntered(false);
    setTimeout(() => {
      onClose && onClose();
      setSelectedRating(null);
      setExplanation('');
    }, 300);
  }

  function handleSubmit() {
    FeedbackService.submitFeedback(selectedRating, explanation)
      .then((response) => {
        console.log('Feedback successfully sent:', response);
      })
      .catch((error) => {
        console.error('Error submitting feedback:', error);
      });
    handleClose();
  }

  const ratingButtons = [
    { id: 'bad', label: 'Bad', color: 'red' },
    { id: 'medium', label: 'Medium', color: 'yellow' },
    { id: 'good', label: 'Good', color: 'green' },
  ];

  const colorClasses = {
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      onClick={handleClose}
    >
      {/* Backdrop - transparent but clickable */}
      <div
        className={`absolute inset-0 bg-black/20 pointer-events-auto transition-opacity duration-300 ${
          entered && !exiting ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Popup Container */}
      <div className="relative z-10 w-full max-w-sm mx-4 pointer-events-auto">
        <div
          className={`rounded-2xl bg-slate-800 text-white shadow-lg transform transition-all duration-300 ease-out ${
            entered && !exiting ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
          }`}
            onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-semibold">How was your experience?</h2>
          </div>

          {/* Rating Buttons */}
          <div className="p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-3">
              {ratingButtons.map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setSelectedRating(btn.id)}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    selectedRating === btn.id
                      ? `${colorClasses[btn.color]} text-white shadow-lg scale-105`
                      : 'bg-slate-700 text-gray-200 hover:bg-slate-600'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Expandable Explanation Section */}
            <div
              className={`overflow-hidden transition-all duration-300 ${
                selectedRating ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0'
              }`}
            >
              <div className="mt-4 pt-4 border-t border-slate-700 space-y-3 flex flex-col items-center">
                <label className="block text-sm font-medium text-gray-300">
                  Tell us more (optional)
                </label>
                <textarea
                  ref={textareaRef}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="What could we improve? What did you like?"
                  className="w-5/6 bg-slate-700 text-white placeholder-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-24"
                />

                {/* Submit Button */}
                <button
                  onClick={() => {
                    handleSubmit();
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                >
                  Submit Feedback
                </button>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
