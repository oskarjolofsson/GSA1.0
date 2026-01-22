import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PanelLeftClose } from "lucide-react";
import ThumbnailImage from "./thumbnailImage"
import Graph from "./graph"
import ProgressBar from "./progress"
import ProfileBar from "./profileBar"
import SidebarNav from "./sidebarNav"


export default function DashboardSidebar() {
    const [isOpen, setIsOpen] = useState(true);
    const navigate = useNavigate();

    return (
        <div className={`flex flex-col border-r border-white/10 shadow-[2px_0_10px_-2px_rgba(0,0,0,0.6)] h-full rounded-r-xl bg-[#121827] transition-all duration-300 ease-in-out ${isOpen ? 'w-80' : 'w-24'
            }`}>
            {/* Top Section with Logo and Toggle */}
            <div className={`flex items-center justify-between p-4 ${!isOpen && 'flex-col gap-2'}`}>
                {!isOpen ? (
                    <button
                        onClick={() => {
                            setIsOpen(true);
                        }}
                        className="p-2 hover:bg-gray-700 hover:bg-opacity-40 rounded-lg transition-colors duration-200"
                        aria-label="Open sidebar"
                    >
                        <img
                            src="/icons/true_swing_logo3.png"
                            alt="True Swing Logo"
                            className="h-12 w-12 transition-all duration-300"
                        />
                    </button>
                ) : (
                    <>
                        <button
                            onClick={() => {
                                navigate("/dashboard");
                            }}
                            className="p-2 hover:bg-gray-700 hover:bg-opacity-40 rounded-lg transition-colors duration-200"
                            aria-label="Open sidebar"
                        >
                            <img
                                src="/icons/true_swing_logo3.png"
                                alt="True Swing Logo"
                                className="h-12 w-12 transition-all duration-300"
                            />
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-gray-700 hover:bg-opacity-40 rounded-lg transition-colors duration-200"
                            aria-label="Close sidebar"
                        >
                            <PanelLeftClose className="w-5 h-5 text-white" />
                        </button>
                    </>
                )}
            </div>

            

            {/* Spacer */}
            <div className="flex-1" />

            {/* Sidebar Navigation - above profile bar */}
            <div className="border-b border-white/10 p-2 w-full">
                <SidebarNav isOpen={isOpen} />
            </div>

            {/* Profile Bar - at bottom */}
            <div className="border-t border-white/10 p-2 w-full flex items-center justify-center">
                <ProfileBar showName={isOpen} onOpenSidebar={() => setIsOpen(true)} />
            </div>

        </div>
    )
}