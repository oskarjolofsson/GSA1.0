import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ThumbnailImage from "./thumbnailImage"
import Graph from "./graph"
import ProgressBar from "./progress"
import ProfileBar from "./profileBar"


export default function DashboardSidebar() {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className={`flex flex-col border-r border-white/10 shadow-[2px_0_10px_-2px_rgba(0,0,0,0.6)] h-full rounded-r-xl bg-[#121827] transition-all duration-300 ease-in-out ${
            isOpen ? 'w-80' : 'w-24'
        }`}>
            {/* Toggle Button */}
            <div className="w-full flex justify-end p-2">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 hover:bg-gray-700 hover:bg-opacity-40 rounded-lg transition-colors duration-200"
                    aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
                >
                    {isOpen ? (
                        <ChevronLeft className="w-5 h-5 text-white" />
                    ) : (
                        <ChevronRight className="w-5 h-5 text-white" />
                    )}
                </button>
            </div>

            {/* Section 1 */}
            {isOpen && (
                <div className="flex-1 border-b border-white/10 p-6 text-center w-full">
                {/* Image of thumbnail */}
                    <ThumbnailImage />
                    
                    <h2 className="text-xl font-bold text-white mb-3">Current Analysis</h2>
                    <p className="text-sm text-white/70">Date it was made</p>
                    
                </div>
            )}

            {/* Section 2 */}
            {isOpen && (
                <div className="flex-1 border-b border-white/10 p-6 text-center w-full">

                    <Graph />
                    <h2 className="text-xl font-bold text-white">Recent Activity</h2>
                </div>
            )}

            {/* Section 3 */}
            {isOpen && (
                <div className="flex-1 border-white/10 p-6 w-full">
                    <h2 className="text-xl font-bold text-white mb-3">Goals</h2>
                    
                    {/* Progress-bar */}
                    <ProgressBar progress={75} />

                    <p className="text-sm text-white/70">75% of your weekly goal achieved</p>
                </div>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Profile Bar - at bottom */}
            <div className="border-t border-white/10 p-2 w-full flex items-center justify-center">
                <ProfileBar showName={isOpen} onOpenSidebar={() => setIsOpen(true)} />
            </div>

        </div>
    )
}