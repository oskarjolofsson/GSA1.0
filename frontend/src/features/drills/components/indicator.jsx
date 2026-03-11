

export default function Indicator({ type, title, description, onClick }) {
    const success = type === 'success';

    const colors = success
        ? {
            border: 'border-green-500/40',
            bg: 'bg-green-500/10',
            hover: 'hover:bg-green-500/20',
            shadow: 'hover:shadow-green-500/20',
            circle: 'bg-green-600',
            text: 'text-green-400'
        }
        : {
            border: 'border-red-500/40',
            bg: 'bg-red-500/10',
            hover: 'hover:bg-red-500/20',
            shadow: 'hover:shadow-red-500/20',
            circle: 'bg-red-600',
            text: 'text-red-400'
        };

    const task_list = description.split('.').filter(line => line.trim() !== '');

    return (
        <div className="flex flex-col items-center gap-2 w-full">
            <h3 className={`font-semibold ${colors.text} text-xs xs:text-sm md:text-base mb-1`}>
                {title}
            </h3>
            <button
                onClick={onClick}
                className={`rounded-2xl border ${colors.border} ${colors.bg} ${colors.hover}
                            p-2 xs:p-3 sm:p-6 w-full text-left transition-all duration-200
                            hover:shadow-xl active:scale-[0.98] h-full ${colors.shadow}`}
            >
                <div className="flex items-start gap-2 xs:gap-3 sm:gap-4">

                    {/* Icon */}
                    <div className={`hidden xs:flex w-5 h-5 xs:w-5 xs:h-5 sm:w-12 sm:h-12 rounded-full ${colors.circle} items-center justify-center sm:text-xl text-sm flex-shrink-0`}>
                        {success ? "✓" : "✕"}
                    </div>

                    {/* Text */}
                    <div className="space-y-2 xs:space-y-3 sm:space-y-3">
                        {task_list.map((line, index) => (
                            <div key={index} className="flex items-start gap-2 xs:gap-3">

                                {/* Check icon */}
                                <div className="mt-1 w-4 h-4 xs:w-5 xs:h-5 rounded-md border border-neutral-500 flex items-center justify-center text-xs text-neutral-300">
                                    <span className="text-xs">•</span>
                                </div>

                                {/* Text */}
                                <p className="text-neutral-300 leading-relaxed text-xs xs:text-sm md:text-base">
                                    {line.trim()}
                                </p>

                            </div>
                        ))}
                    </div>

                </div>
            </button>

        </div>
    )
}