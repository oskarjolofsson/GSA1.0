

export default function DashboardSidebar() {

    return (
        <div className="flex flex-col w-80 border-r border-white/10 shadow-[2px_0_10px_-2px_rgba(0,0,0,0.6)] h-full items-center">
            {/* Section 1 */}
            <div className="flex-1 border-b border-white/10 p-6 text-center">
            {/* Image of thumbnail */}
                <div className="mb-4 w-full h-32 bg-white/10 rounded-lg flex items-center justify-center">
                    <span className="text-white/50">Thumbnail Image</span>
                </div>
                
                <h2 className="text-xl font-bold text-white mb-3">Current Analysis</h2>
                <p className="text-sm text-white/70">Date it was made</p>
                
            </div>

            {/* Section 2 */}
            <div className="flex-1 border-b border-white/10 p-6 text-center">

                <div className="mb-4 w-full h-32 bg-white/10 rounded-lg flex items-center justify-center">
                    <span className="text-white/50 text-sm p-2 w-full">Graph of recent activity</span>
                </div>

                <h2 className="text-xl font-bold text-white">Recent Activity</h2>
            </div>

            {/* Section 3 */}
            <div className="flex-1 border-white/10 p-6">
                <h2 className="text-xl font-bold text-white mb-3">Goals</h2>
                
                {/* Progress-bar */}
                <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-blue-500 w-3/4"></div>
                </div>

                <p className="text-sm text-white/70">75% of your weekly goal achieved</p>
            </div>

            <div className="inset -x-0 bottom-0 p-6 w-full min-h-16 border-t border-white/10 flex items-center justify-center">
                
                {/* Profile Image */}

                {/* Name/email */}

            </div>

        </div>
    )
}