import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PanelLeftClose } from "lucide-react";
import ProfileBar from "./profileBar"
import SidebarNav from "./sidebarNav"
import ActiveIssues from "./active_issues"


export default function DashboardSidebar() {
    const [isOpen, setIsOpen] = useState(true);
    const navigate = useNavigate();

    

    return (
        <div className={`flex flex-col border-r border-white/10 shadow-[2px_0_10px_-2px_rgba(0,0,0,0.6)] h-full rounded-r-xl bg-[#121827] transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-24'
            }`}>
            {/* Top Section with Logo and Toggle */}
            <div className={`flex items-center justify-between p-4 ${!isOpen && 'flex-col gap-2'}`}>
                {!isOpen ? (
                    <button
                        onClick={() => {
                            setIsOpen(true);
                        }}
                        className="p-2 bg-transparent hover:bg-transparent rounded-lg transition-colors duration-200"
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
                            className="p-2 bg-transparent hover:bg-transparent rounded-lg transition-colors duration-200"
                            aria-label="Open sidebar"
                        >
                            <img
                                src="/icons/true_swing_logo3.png"
                                alt="True Swing Logo"
                                className="h-8 w-8 transition-all duration-300"
                            />
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 bg-transparent hover:bg-transparent rounded-lg transition-colors duration-200"
                            aria-label="Close sidebar"
                        >
                            <PanelLeftClose className="w-5 h-5 text-white" />
                        </button>
                    </>
                )}
            </div>

            {/* Pages Header */}
            <div className={`px-4 py-2 ${!isOpen && 'hidden'} text-center mt-4 border border-white/10 rounded-lg mx-2 bg-white/5`}>
                <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
                    Pages
                </h2>
            </div>

            {/* Sidebar Navigation - at top */}
            <div className="border-white/10 p-2 w-full">
                <SidebarNav isOpen={isOpen} />
            </div>

            {/* Active Issues Header */}
            <div className={`px-4 py-2 ${!isOpen && 'hidden'} text-center mt-4 border border-white/10 rounded-lg mx-2 bg-white/5`}>
                <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
                    Active Golf Issues
                </h2>
            </div>

            {/* Active Issues Section */}
            <div className="flex-1 overflow-auto overflow-auto">
                {isOpen && <ActiveIssues />}
            </div>

            {/* Profile Bar - at bottom */}
            <div className="border-t border-white/10 p-2 w-full flex items-center justify-center">
                <ProfileBar showName={isOpen} onOpenSidebar={() => setIsOpen(true)} />
            </div>

        </div>
    )
}