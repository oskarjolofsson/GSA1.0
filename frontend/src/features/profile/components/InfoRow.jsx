import Skeleton from './Skeleton.jsx';

export default function InfoRow({ label, value, isLoading, className = '' }) {
    return (
        <div
            className={`flex justify-between items-center bg-white/10 dark:bg-gray-800/30 backdrop-blur-md border border-white/20 dark:border-gray-700/40 rounded-xl px-4 py-3 shadow-sm mb-4 ${className}`}
        >
            <div className="w-full">
                <p className="text-sm text-white/80">{label}</p>
                <p className="text-base font-medium text-white">
                    {isLoading ? <Skeleton width="w-24" /> : value}
                </p>
            </div>
        </div>
    );
}
