import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type PopupTone = "amber" | "emerald" | "blue" | "slate";

interface InfoPopupProps {
  open: boolean;
  onClose: () => void;
  title: string;
  text: string;
  icon?: ReactNode;
  tone?: PopupTone;
}

const toneStyles: Record<PopupTone, {
  badge: string;
  border: string;
  bg: string;
  iconWrap: string;
  title: string;
}> = {
  amber: {
    badge: "bg-amber-400/10 text-amber-200 border-amber-300/15",
    border: "border-amber-300/15",
    bg: "bg-slate-950/95",
    iconWrap: "bg-amber-400/15 text-amber-300",
    title: "text-amber-100",
  },
  emerald: {
    badge: "bg-emerald-400/10 text-emerald-200 border-emerald-300/15",
    border: "border-emerald-300/15",
    bg: "bg-slate-950/95",
    iconWrap: "bg-emerald-400/15 text-emerald-300",
    title: "text-emerald-100",
  },
  blue: {
    badge: "bg-sky-400/10 text-sky-200 border-sky-300/15",
    border: "border-sky-300/15",
    bg: "bg-slate-950/95",
    iconWrap: "bg-sky-400/15 text-sky-300",
    title: "text-sky-100",
  },
  slate: {
    badge: "bg-white/5 text-slate-200 border-white/10",
    border: "border-white/10",
    bg: "bg-slate-950/95",
    iconWrap: "bg-white/10 text-slate-200",
    title: "text-white",
  },
};

export default function InfoPopup({
  open,
  onClose,
  title,
  text,
  icon,
  tone = "slate",
}: InfoPopupProps) {
  useEffect(() => {
    if (!open) return;

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
  }, [open, onClose]);

  if (!open) return null;

  const styles = toneStyles[tone];

  return createPortal(
    <div
  className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="info-popup-title"
    >
      <div
        className={`w-full max-w-lg rounded-3xl border ${styles.border} ${styles.bg} shadow-[0_20px_60px_-12px_rgba(0,0,0,0.8)]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${styles.iconWrap}`}>
              {icon}
            </div>
            <div>
              <h3
                id="info-popup-title"
                className={`mt-2 text-lg font-semibold sm:text-xl ${styles.title}`}
              >
                {title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label="Close popup"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          <p className="text-sm leading-7 text-slate-300 sm:text-base">
            {text}
          </p>
        </div>

        <div className="flex justify-end border-t border-white/10 p-4 sm:px-6 sm:py-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/8 px-4 py-2.5 text-sm font-medium text-slate-100 transition-colors hover:bg-white/12 focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}