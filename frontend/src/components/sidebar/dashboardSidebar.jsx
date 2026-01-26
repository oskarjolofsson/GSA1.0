import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PanelLeftClose } from "lucide-react";
import ProfileBar from "./profileBar"
import SidebarNav from "./sidebarNav"


export default function DashboardSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    

    return (
        <>
            {/* Open button on mobile - shown when sidebar is closed */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed top-4 left-4 md:hidden z-40 p-2 bg-transparent hover:bg-white/10 rounded-lg transition-colors duration-200"
                    aria-label="Open sidebar"
                >
                    <img
                        src="/icons/true_swing_logo3.png"
                        alt="True Swing Logo"
                        className="h-8 w-8"
                    />
                </button>
            )}

            {/* Overlay on mobile when sidebar is open */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 md:hidden z-30"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`flex flex-col border-r border-white/10 shadow-[2px_0_10px_-2px_rgba(0,0,0,0.6)] h-full rounded-r-xl bg-[#121827] transition-all duration-300 ease-in-out md:relative fixed top-0 left-0 z-40 md:z-auto md:translate-x-0 ${isOpen ? 'w-64 translate-x-0' : 'w-0 md:w-24 -translate-x-full md:translate-x-0 hidden md:flex'
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

            {/* Sidebar Navigation - at top */}
            <div className="border-white/10 p-2 w-full">
                <SidebarNav isOpen={isOpen} onClick={() => setIsOpen(false)} />
            </div>

            {/* Active Issues Header */}
            {/* <div className={`px-4 py-2 ${!isOpen && 'hidden'} text-center mt-4 border border-white/10 rounded-lg mx-2 bg-white/5`}>
                <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
                    Active Golf Issues
                </h2>
            </div>

            
            <div className="flex-1 overflow-auto overflow-auto">
                {isOpen && <ActiveIssues />}
            </div> */}

            <div className="flex-1" />

            {/* Profile Bar - at bottom */}
            <div className="border-t border-white/10 p-2 w-full flex items-center justify-center">
                <ProfileBar showName={isOpen} onOpenSidebar={() => setIsOpen(true)} />
            </div>

        </div>
        </>
    )
}