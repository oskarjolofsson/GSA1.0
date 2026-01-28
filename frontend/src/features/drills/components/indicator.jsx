

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

    return (
        <div className="flex flex-col items-center gap-2 w-full">
            <button
                className={`rounded-xl border ${colors.border} ${colors.bg} ${colors.hover} active:scale-95 p-3 md:p-4 flex items-center justify-center transition-all duration-200 cursor-pointer w-full hover:shadow-lg ${colors.shadow}`}
                onClick={onClick}
            >
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${colors.circle} flex items-center justify-center text-lg md:text-xl`}>
                    {success ? "✓" : "✕"}
                </div>
            </button>
            <div className="text-center w-full">
                <h3 className={`font-semibold ${colors.text} mb-1 text-xs md:text-sm`}>
                    {title}
                </h3>
                <p className="text-xs text-neutral-400 leading-tight">
                    {description}
                </p>
            </div>
        </div>
    )
}