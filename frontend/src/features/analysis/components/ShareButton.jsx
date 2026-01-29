import { Share2 } from "lucide-react";

export default function ShareButton({ onClick }) {
    return (
        <div className="flex justify-end mb-6">
            <button
                onClick={onClick}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-red px-4 py-2 rounded-lg transition-colors duration-200"
            >
                <Share2 size={20} />
                Share
            </button>
        </div>
    );
}
