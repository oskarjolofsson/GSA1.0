import React, { useState, useMemo } from "react";

/**
 * items: [
 *  {
 *    type: "image" | "video",
 *    src: "/path/file",
 *    title?: string,
 *    label?: string,
 *    poster?: string, // for video
 *  }
 * ]
 */

const MediaCarousel = ({ items = [] }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const len = items.length;
    if (!len) return null;

    const mod = (n) => (n + len) % len;

    const goToIndex = (index) => {
        setActiveIndex(mod(index));
    };

    const positions = useMemo(() => {
        // For each index, decide if it is left / center / right / hidden
        return items.map((_, index) => {
            if (index === activeIndex) return "center";
            if (index === mod(activeIndex - 1)) return "left";
            if (index === mod(activeIndex + 1)) return "right";
            return "hidden";
        });
    }, [activeIndex, items, len]);

    return (
        <section className="w-full max-w-4xl mx-auto text-slate-50 font-sans px-4 mt-12 mb-12">
            {/* Carousel track */}
            <div className="relative h-[200px] sm:h-[240px] md:h-[280px]">
                <div className="relative h-full w-full flex items-center justify-center">
                    {items.map((item, index) => {
                        const position = positions[index];

                        let transformClasses = "";
                        let opacityClasses = "";
                        let zIndex = "z-0";
                        let sizeClasses = "";
                        let showContent = false;
                        let positionClasses = "";

                        switch (position) {
                            case "center":
                                positionClasses =
                                    "z-30 w-[60%] sm:w-[55%] md:w-[50%] opacity-100";
                                showContent = true;
                                break;
                            case "left":
                                positionClasses =
                                    "z-10 w-[45%] sm:w-[40%] md:w-[35%] scale-90 opacity-40 -ml-[15rem]";
                                break;
                            case "right":
                                positionClasses =
                                    "z-10 w-[45%] sm:w-[40%] md:w-[35%] scale-90 opacity-40 ml-[15rem]";
                                break;
                            default:
                                positionClasses = "opacity-0 pointer-events-none";
                        }

                        return (
                            <article
                                key={index}
                                className={`
                                    absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                                    transition-all duration-500 ease-out will-change-transform
                                    ${positionClasses}
                                `}
                            >
                                <div className={`rounded-2xl overflow-hidden ${position === "center" ? "border-2 border-white/20 shadow-2xl" : "border border-white/5"} bg-black`}>
                                    <div className="aspect-[16/9] relative overflow-hidden">
                                        {/* Index counters - only on center */}
                                        {position === "center" && (
                                            <>
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                                                    <div className="text-xs font-bold text-white/80 drop-shadow-lg">
                                                        {String(activeIndex + 1).padStart(2, "0")}
                                                    </div>
                                                </div>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                                                    <div className="text-xs font-bold text-white/80 drop-shadow-lg">
                                                        {String(items.length).padStart(2, "0")}
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {item.type === "video" ? (
                                            <video
                                                className="h-full w-full object-cover"
                                                controls={position === "center"}
                                                poster={item.poster}
                                                key={`${index}-${position}`}
                                            >
                                                <source src={item.src} type="video/mp4" />
                                                Your browser does not support the video tag.
                                            </video>
                                        ) : (
                                            <img
                                                src={item.src}
                                                alt={item.title || "Carousel media"}
                                                className="h-full w-full object-cover"
                                            />
                                        )}
                                    </div>

                                    {/* Caption - only show on center */}
                                    {showContent && (item.label || item.title) && (
                                        <div className="flex items-baseline justify-between gap-2 px-3 py-2 bg-gradient-to-t from-black/80 to-transparent">
                                            {item.label && (
                                                <span className="inline-flex items-center rounded-full border border-slate-500/50 bg-slate-900/80 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-slate-200">
                                                    {item.label}
                                                </span>
                                            )}
                                            {item.title && (
                                                <h3 className="ml-auto text-xs font-medium text-slate-100">
                                                    {item.title}
                                                </h3>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>

            {/* Controls */}
            <div className="mt-4 flex items-center justify-center gap-4">
                <button
                    type="button"
                    onClick={() => goToIndex(activeIndex - 1)}
                    aria-label="Previous"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/90 text-base text-slate-100 shadow-lg shadow-black/40 transition hover:-translate-y-0.5 hover:bg-slate-700"
                >
                    ‹
                </button>

                <button
                    type="button"
                    onClick={() => goToIndex(activeIndex + 1)}
                    aria-label="Next"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/90 text-base text-slate-100 shadow-lg shadow-black/40 transition hover:-translate-y-0.5 hover:bg-slate-700"
                >
                    ›
                </button>
            </div>
        </section>
    );
};

export default MediaCarousel;
