export default function CTAButton() {
    return (
        <div className="flex justify-center">
            <button className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-emerald-500/90 hover:bg-emerald-500 text-white font-semibold rounded-xl sm:rounded-2xl transition-all duration-200 shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50 hover:scale-105 active:scale-95">
                View Recommended Drills
                <span aria-hidden="true">→</span>
            </button>
        </div>
    );
}
