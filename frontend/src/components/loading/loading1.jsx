

export default function Loading1() {
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-white/70 mt-4">Loading...</p>
        </div>
    );
}