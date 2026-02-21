interface MainTextProps {
    title: string;
    description: string | null;
}

export default function MainText({ title, description }: MainTextProps) {
    return (
        <div className="lg:col-span-2 flex flex-col justify-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                {title}
            </h2>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
                {description}
            </p>
        </div>
    );
}