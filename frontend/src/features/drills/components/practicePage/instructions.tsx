import { useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

function splitInstructions(instructions: string) {
    return instructions
        .split(".")
        .map((step) => step.trim())
        .filter(Boolean);
}

type DrillPopupProps = {
    title: string;
    instructions: string;
    isOpen: boolean;
    onClose: () => void;
};

export default function DrillPopup({ title, instructions, isOpen, onClose }: DrillPopupProps) {
    const steps = useMemo(() => splitInstructions(instructions), [instructions]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen ? (
                <motion.div
                    className="fixed inset-0 z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <button
                        aria-label="Close popup"
                        className="absolute inset-0 h-full w-full bg-slate-950/80 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <div className="absolute inset-0 flex items-center justify-center p-1 sm:p-4">
                        <motion.div
                            initial={{ opacity: 0, y: 16, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 12, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className="relative w-full max-w-5xl overflow-hidden rounded-[1.25rem] border-2 border-white/20 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.18),_rgba(2,6,23,0.96)_40%)] shadow-2xl sm:rounded-[1.75rem]"
                        >
                            <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:20px_20px]" />
                            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_18%,transparent_82%,rgba(255,255,255,0.03))]" />

                            <div className="relative px-3 pb-4 pt-4 sm:px-7 sm:pb-7 sm:pt-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="w-full text-center">
                                        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/55 sm:text-xs sm:tracking-[0.35em]">
                                            Practice Drill
                                        </p>
                                        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-5xl">
                                            {title}
                                        </h2>
                                        <div className="mx-auto mt-4 h-px w-full max-w-xl bg-white/10 sm:mt-5" />
                                    </div>
                                </div>

                                <div className="mt-4 space-y-3 sm:mt-8 sm:space-y-6">
                                    {steps.map((step, index) => (
                                        <div
                                            key={`${index}-${step}`}
                                            className="rounded-[1rem] border-2 border-white/25 bg-black/20 px-3 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-md sm:rounded-[1.4rem] sm:px-6 sm:py-6"
                                        >
                                            <div className="flex items-start gap-3 sm:gap-6">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-base font-semibold text-white sm:h-14 sm:w-14 sm:text-2xl">
                                                    {index + 1}
                                                </div>
                                                <p className="pt-0.5 text-sm leading-6 text-white/88 sm:pt-1 sm:text-2xl sm:leading-[1.65]">
                                                    {step}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 border-t border-white/20 pt-4 sm:mt-10 sm:pt-5">
                                    <button
                                        onClick={onClose}
                                        className="mx-auto flex w-full items-center justify-center rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_10px_30px_rgba(255,255,255,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-[0_14px_40px_rgba(255,255,255,0.22)] active:translate-y-0 sm:max-w-md sm:px-6 sm:py-4 sm:text-base"
                                    >
                                        Start Practice
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}