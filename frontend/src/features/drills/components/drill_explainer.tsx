

export default function DrillExplainer({ title, description }: { title: string; description: string }) {

    const task_list = description.split('.').filter(line => line.trim() !== '');

    return (
        <div className="flex flex-col animate-slide-up-delayed max-w-2xl mx-auto">
            <div className="mb-4 text-center">
                <span className="text-xs uppercase tracking-wider text-neutral-400">
                    Practice Drill
                </span>
                <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-semibold text-neutral-100 mt-1">
                    {title}
                </h2>
                <div className="h-px bg-neutral-800 mt-3 w-80 xs:w-96 mx-auto"></div>
            </div>

            <ol className="space-y-2 xs:space-y-3 sm:space-y-4">
                {task_list.map((line, index) => (
                    <li
                        key={index}
                        className="flex items-start gap-2 xs:gap-3 sm:gap-4 p-2 xs:p-3 rounded-lg bg-neutral-900/40 border border-neutral-800"
                    >
                        {/* Step number */}
                        <span className="flex items-center justify-center w-6 h-6 xs:w-7 xs:h-7 text-xs xs:text-sm font-semibold rounded-full bg-neutral-800 text-neutral-200 flex-shrink-0">
                            {index + 1}
                        </span>

                        {/* Instruction */}
                        <span className="text-xs xs:text-sm sm:text-base md:text-lg text-neutral-300 leading-relaxed">
                            {line.trim()}
                        </span>
                    </li>
                ))}
            </ol>
        </div>
    )
}