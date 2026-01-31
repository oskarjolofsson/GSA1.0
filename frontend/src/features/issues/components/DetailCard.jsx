export default function DetailCard({ icon: Icon, title, description, colorClass }) {
    return (
        <div
            className={`rounded-3xl bg-gradient-to-br ${colorClass} backdrop-blur-md border shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] p-6 sm:p-8 transition-all duration-300 hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)]`}
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
                    <Icon className="w-5 h-5 text-white/80" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white">
                    {title}
                </h3>
            </div>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {description}
            </p>
        </div>
    );
}