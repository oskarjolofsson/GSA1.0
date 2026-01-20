

export default function ProgressBar({ progress = 75 }) {
    return (
        <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-blue-500" style={{ width: `${progress}%` }}></div>
        </div>
    )
}