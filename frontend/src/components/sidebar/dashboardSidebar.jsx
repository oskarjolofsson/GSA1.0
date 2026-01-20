import ThumbnailImage from "./thumbnailImage"
import Graph from "./graph"
import ProgressBar from "./progress"
import ProfileBar from "./profileBar"


export default function DashboardSidebar() {

    return (
        <div className="flex flex-col w-80 border-r border-white/10 shadow-[2px_0_10px_-2px_rgba(0,0,0,0.6)] h-full items-center rounded-r-xl m-t-4 bg-[#121827]">
            {/* Section 1 */}
            <div className="flex-1 border-b border-white/10 p-6 text-center">
            {/* Image of thumbnail */}
                <ThumbnailImage />
                
                <h2 className="text-xl font-bold text-white mb-3">Current Analysis</h2>
                <p className="text-sm text-white/70">Date it was made</p>
                
            </div>

            {/* Section 2 */}
            <div className="flex-1 border-b border-white/10 p-6 text-center">

                <Graph />
                <h2 className="text-xl font-bold text-white">Recent Activity</h2>
            </div>

            {/* Section 3 */}
            <div className="flex-1 border-white/10 p-6">
                <h2 className="text-xl font-bold text-white mb-3">Goals</h2>
                
                {/* Progress-bar */}
                <ProgressBar progress={75} />

                <p className="text-sm text-white/70">75% of your weekly goal achieved</p>
            </div>

            <div className="inset -x-0 bottom-0 p-1 w-full border-t border-white/10 flex items-center justify-center">
                
                <ProfileBar />

            </div>

        </div>
    )
}