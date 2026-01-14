import { useState, useEffect } from 'react';
import { X } from 'lucide-react';


export default function DrillPopup({ drill, image, onClose }) {
    const [entered, setEntered] = useState(false);
    const [exiting, setExiting] = useState(false);

    // Animation trigger
    useEffect(() => {
        if (drill) {
            setExiting(false);
            requestAnimationFrame(() => setEntered(true));
        } else {
            setEntered(false);
            setExiting(false);
        }
    }, [drill]);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && drill) {
                handleClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [drill]);

    const handleClose = () => {
        setEntered(false);
        setExiting(true);
        setTimeout(onClose, 300);
    };

    if (!drill) return null;

    // Calculate popup dimensions
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 1920;
    const popupHeight = Math.max(screenHeight * 0.9, 1080);
    const fallbackWidth = 1080;
    const fallbackHeight = 1920;
    
    // Use image dimensions if available, otherwise use fallback
    const aspectRatio = image ? (fallbackWidth / fallbackHeight) : (fallbackWidth / fallbackHeight);
    const popupWidth = popupHeight * aspectRatio;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-auto transition-colors duration-300 ${
            entered && !exiting ? 'bg-black/50' : 'bg-black/0'
            }`}
            onClick={handleClose}
        >
            <div
                className={`
                    relative pointer-events-auto transform transition-all duration-300 ease-out max-h-[90vh] max-w-[90vw]
                    ${entered && !exiting ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}
                `}
                style={{
                    width: `${popupWidth}px`,
                    height: `${popupHeight}px`,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Image Background */}
                {image ? (
                    <img
                        src={image}
                        alt="Drill"
                        className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                    />
                ) : (
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl" >
                        {/* Text to say that no image is available */}
                        <div className="flex items-center justify-center h-full">
                            <p className="text-white text-lg">No image available</p>
                        </div>

                    </div>
                    
                )}

                {/* Dark Overlay at Bottom */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent rounded-b-2xl p-6 pt-20">
                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 bg-slate-800/80 hover:bg-slate-700 text-white p-2 rounded-full transition-colors duration-200"
                    >
                        <X size={24} />
                    </button>

                    {/* Drill Text */}
                    <div className="text-white">
                        <h2 className="text-2xl font-bold mb-2">{drill}</h2>
                    </div>
                </div>
            </div>
        </div>
    );
}