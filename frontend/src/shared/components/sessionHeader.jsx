import { Share2 } from "lucide-react";

export default function SessionHeader({ onShareClick }) {

    // Session-header placed on top of the screen
    // Share-button on the right side
    return (
        <div className="h-16 border-b border-l border-white/10 rounded-l-xl flex items-center justify-end px-6 w-full ml-2">
            
            {/* Share button */}
            <div className="flex items-center gap-4 mr-16">
                <button 
                    onClick={onShareClick}
                    className="flex items-center gap-2 border-blue-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                    <Share2 size={20} />
                    <span className="text-sm">Share</span>
                </button>
            </div>

        </div>
    );
}