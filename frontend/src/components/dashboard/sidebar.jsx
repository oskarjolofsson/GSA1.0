import React, { useEffect, useMemo, useState } from "react";
import { PanelLeftOpen, X, ChevronRight } from "lucide-react";

export default function Sidebar({
    list = [],
    title = "Analyses",
    subHeader = "",
    initialOpen = false,
    onSelect, // optional: (item, index) => void
}) {
    const [open, setOpen] = useState(initialOpen);

    // Normalize list items into { id, label, image? }
    const items = useMemo(() => {
        return (list || []).map((it, i) => {
            if (typeof it === "string") return { id: String(i), label: it, image: null };
            if (it && typeof it === "object") {
                return {
                    id: it.id != null ? String(it.id) : String(i),
                    label: it.label != null ? String(it.label) : String(i),
                    image: it.image ?? null, // string URL or ReactNode
                };
            }
            return { id: String(i), label: String(it), image: null };
        });
    }, [list]);

    // Close on Esc
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    const toggle = () => setOpen((v) => !v);

    const handleSelect = (item, index) => {
        onSelect?.(item, index);
        setOpen(false);
    };

    return (
        <>
            {/* Floating trigger */}
            {!open && (
                <button
                    type="button"
                    onClick={toggle}
                    aria-label={open ? "Close analyses" : "Open analyses"}
                    aria-expanded={open}
                    className={[
                        "fixed top-4 left-4 z-[110]",
                        "h-11 px-3.5 rounded-2xl",
                        // liquid glass button surface
                        "bg-white/10 backdrop-blur-xl",
                        "border border-white/15",
                        "shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
                        "flex items-center gap-2.5",
                        "transition-all duration-200",
                        "hover:bg-white/14 hover:border-white/20",
                        "active:scale-[0.98]",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                    ].join(" ")}
                >
                    <PanelLeftOpen className="h-5 w-5 text-white/85" aria-hidden="true" />
                    <span className="text-sm font-semibold tracking-tight text-white/90">
                        {title}
                    </span>

                    {/* Subtle gloss highlight */}
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-2xl"
                        style={{
                            background:
                                "linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.02) 45%, rgba(255,255,255,0.0) 70%)",
                        }}
                    />
                </button>
            )}


            {/* Overlay */}
            <div
                className={[
                    "fixed inset-0 z-[100] transition-opacity duration-200",
                    open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
                ].join(" ")}
                onClick={() => setOpen(false)}
            >
                {/* Dark dim + subtle vignette */}
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 [background:radial-gradient(60%_60%_at_50%_20%,rgba(255,255,255,0.10),rgba(0,0,0,0))]" />
            </div>

            {/* Sidebar panel */}
            <aside
                role="navigation"
                aria-label={title}
                className={[
                    "fixed top-0 left-0 bottom-0 z-[101] w-full md:w-[22rem]",
                    // liquid glass panel surface
                    "bg-white/8 backdrop-blur-2xl",
                    "border-r border-white/12",
                    "shadow-[20px_0_60px_rgba(0,0,0,0.55)]",
                    "flex flex-col",
                    "transition-transform duration-300 ease-out",
                    open ? "translate-x-0" : "-translate-x-full",
                ].join(" ")}
            >
                {/* Panel gloss / light streaks */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.02) 45%, rgba(255,255,255,0.0) 70%)",
                    }}
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl bg-white/10"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-0 left-0 h-64 w-full [background:radial-gradient(80%_60%_at_20%_100%,rgba(255,255,255,0.08),rgba(255,255,255,0))]"
                />

                {/* Header */}
                <div className="relative flex items-center gap-3 px-4 py-4 border-b border-white/10">
                    <div className="flex-1">
                        <h2 className="text-base font-semibold text-white/90 tracking-tight">
                            {title}
                        </h2>
                        <p className="text-xs text-white/55 mt-0.5">
                            {subHeader}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        aria-label="Close menu"
                        className={[
                            "relative w-9 h-9 rounded-2xl overflow-hidden",
                            "bg-white/10 backdrop-blur-xl",
                            "border border-white/12",
                            "text-white/80",
                            "flex items-center justify-center",
                            "transition-all duration-200",
                            "hover:bg-white/14 hover:text-white hover:border-white/18",
                            "active:scale-[0.98]",
                            "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25",
                        ].join(" ")}
                    >
                        X

                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 z-0 rounded-2xl"
                            style={{
                                background:
                                    "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.02) 55%, rgba(255,255,255,0.0) 75%)",
                            }}
                        />
                    </button>
                </div>

                {/* Navigation items */}
                <nav className="relative flex-1 overflow-y-auto p-3 space-y-2">
                    {items.map((item, idx) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelect(item, idx)}
                            className={[
                                "group w-full rounded-2xl p-3",
                                // glassy card
                                "bg-white/8 backdrop-blur-xl",
                                "border border-white/10",
                                "shadow-[0_10px_24px_rgba(0,0,0,0.25)]",
                                "transition-all duration-200",
                                "hover:bg-white/12 hover:border-white/16",
                                "active:scale-[0.995]",
                                "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25",
                                "flex items-center gap-3",
                            ].join(" ")}
                        >
                            {/* Image frame (square thumbnail) */}
                            <div
                                className={[
                                    "relative h-12 w-12 shrink-0 rounded-xl overflow-hidden",
                                    "bg-white/6",
                                    "border border-white/12",
                                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]",
                                ].join(" ")}
                            >
                                {typeof item.image === "string" && item.image ? (
                                    <img
                                        src={item.image}
                                        alt=""
                                        className="h-full w-full object-cover opacity-95"
                                        loading="lazy"
                                    />
                                ) : item.image ? (
                                    <div className="h-full w-full">{item.image}</div>
                                ) : (
                                    // Placeholder
                                    <div className="h-full w-full grid place-items-center text-white/35 text-xs font-semibold">
                                        IMG
                                    </div>
                                )}

                                {/* Specular highlight */}
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-0"
                                    style={{
                                        background:
                                            "linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.0) 70%)",
                                    }}
                                />
                            </div>

                            {/* Label */}
                            <div className="min-w-0 flex-1 text-left">
                                <div className="text-sm font-semibold text-white/90 tracking-tight truncate">
                                    {item.label}
                                </div>
                                <div className="text-xs text-white/55 mt-0.5 truncate">
                                    View details and feedback
                                </div>
                            </div>

                            {/* Chevron */}
                            <ChevronRight className="h-4 w-4 text-white/35 group-hover:text-white/60 transition-colors" />
                        </button>
                    ))}
                </nav>

                {/* Footer (optional) */}
                <div className="relative p-3 border-t border-white/10">
                    {/* <div className="text-xs text-white/45 px-2">
                        Tip: Press <span className="text-white/65 font-semibold">Esc</span> to close
                    </div> */}
                </div>
            </aside>
        </>
    );
}
