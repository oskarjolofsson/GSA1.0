export default function ActiveIssueButton({ Title, onClick, progress}) {

    const getProgressColor = () => {
        if (progress >= 70) return 'bg-green-500 shadow-lg shadow-green-500/50';
        if (progress >= 40) return 'bg-yellow-500 shadow-lg shadow-yellow-500/50';
        return 'bg-red-500 shadow-lg shadow-red-500/50';
    };

    return (
        <button
            onClick={onClick}
            className="w-full rounded-lg bg-gradient-to-br from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 transition-all duration-200 text-left border border-white/10"
        >
            {/* Main Content */}
            <div className="flex flex-1">
                {/* Left Side - Text */}
                <div className="flex-1 flex items-center pr-4">
                    <h3 className="text-sm font-semibold text-white">{Title}</h3>
                </div>
                {/* Right Side - Placeholder Image */}
                <div className="w-1/3 bg-white/5 rounded-lg flex items-center justify-center border border-white/10 h-12 w-12">
                    <div className="text-white/40 text-xs"></div>
                </div>
            </div>
            
            {/* Bottom Progress Bar */}
            <div className="flex items-center gap-1">
                <div className="flex-1 h-2 bg-white/5 overflow-hidden rounded-full">
                    <div
                        className={`h-full ${getProgressColor()} transition-all duration-300 rounded-full`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <span className="text-xs text-white/60 font-medium whitespace-nowrap">{progress}%</span>
            </div>
        </button>
    )
}