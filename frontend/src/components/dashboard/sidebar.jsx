import React, { useEffect, useMemo, useState } from "react";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react"

export default function Sidebar({
    list = [],
    title = "Menu",
    initialOpen = false,
    onSelect, // optional: (item, index) => void
}) {
    const [open, setOpen] = useState(initialOpen);

    // Normalize list items into { id, label }
    const items = useMemo(() => {
        return (list || []).map((it, i) => {
            if (typeof it === "string") return { id: String(i), label: it };
            if (it && typeof it === "object") {
                return {
                    id: it.id != null ? String(it.id) : String(i),
                    label: it.label != null ? String(it.label) : String(i),
                };
            }
            return { id: String(i), label: String(it) };
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
            {!open && (
                <button
                type="button"
                onClick={toggle}
                aria-label={open ? "Close analyses" : "Open analyses"}
                aria-expanded={open}
                className={[
                    "fixed top-4 left-4 z-[100]",
                    "h-11 px-3 rounded-xl",
                    "bg-slate-900/70 backdrop-blur-md",
                    "border border-white/10 shadow-sm",
                    "flex items-center gap-2",
                    "transition-all duration-200",
                    "hover:bg-slate-900/85 hover:border-white/15",
                    "active:scale-[0.98]",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                ].join(" ")}
            >

                <PanelLeftOpen className="h-5 w-5 text-slate-200" aria-hidden="true" />

                <span className="text-sm font-medium text-slate-200">
                    {title}
                </span>
            </button>
            )}
            


            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-[100] transition-opacity duration-200 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
                onClick={() => setOpen(false)}
            />

            {/* Sidebar panel */}
            <aside
                role="navigation"
                aria-label={title}
                className={`fixed top-0 left-0 bottom-0 z-[101] w-72 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 flex flex-col transition-transform duration-300 ease-out shadow-2xl shadow-black/50 ${open ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-slate-700/50">
                    <h2 className="text-base font-semibold text-slate-100">{title}</h2>
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        aria-label="Close menu"
                        className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/50 grid place-items-center cursor-pointer text-slate-400 hover:text-slate-200 hover:bg-slate-700/80 hover:border-slate-600/50 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Navigation items */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                    {items.map((item, idx) => (
                        <button
                            key={item.id}
                            type="button"
                            className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-800/80 transition-colors cursor-pointer"
                            onClick={() => handleSelect(item, idx)}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>
            </aside>
        </>
    );
}
