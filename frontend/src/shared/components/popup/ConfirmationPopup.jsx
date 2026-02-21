import React, { useEffect, useState } from 'react';

export default function ConfirmationPopup({ isOpen, text, onClose, onConfirm }) {
    const [entered, setEntered] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // small timeout to allow initial render before animating
            requestAnimationFrame(() => setEntered(true));
        } else {
            setEntered(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleClose = () => {
        setEntered(false);
        setTimeout(() => onClose && onClose(), 300);
    };

    const handleConfirm = () => {
        setEntered(false);
        setLoading(true);
        onConfirm().then(() => {
            setLoading(false);
            onClose && onClose();
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
        >
            <div
                className={`bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all duration-300 ease-out
          ${entered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon */}
                <div className="flex items-center justify-center mb-4">
                    <div className="h-12 w-12 rounded-full bg-yellow-500/20 grid place-items-center">
                        <svg viewBox="0 0 24 24" className="h-6 w-6 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 9v4m0 4h.01" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M10.29 3.86 1.82 12.34a2 2 0 0 0 1.42 3.41h16.52a2 2 0 0 0 1.42-3.41L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                </div>

                {/* Text */}
                <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">Confirm Action</h3>
                    <p className="text-sm text-gray-400">{text}</p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleClose}
                        className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={loading}
                    >
                        {loading ? 'Confirming...' : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
}
