import { ReactNode } from "react";

type InfoButtonTone = "amber" | "emerald" | "slate";

interface InfoButtonProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  tone?: InfoButtonTone;
  onClick: () => void;
}

const buttonToneStyles: Record<InfoButtonTone, string> = {
  amber:
    "border-amber-300/15 bg-amber-400/5 hover:bg-amber-400/10 text-amber-100",
  emerald:
    "border-emerald-300/15 bg-emerald-400/5 hover:bg-emerald-400/10 text-emerald-100",
  slate:
    "border-white/10 bg-white/5 hover:bg-white/10 text-slate-100",
};

const iconToneStyles: Record<InfoButtonTone, string> = {
  amber: "bg-amber-400/15 text-amber-300",
  emerald: "bg-emerald-400/15 text-emerald-300",
  slate: "bg-white/10 text-slate-200",
};

export function InfoButton({
  title,
  subtitle,
  icon,
  tone = "slate",
  onClick,
}: InfoButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-2xl border p-4 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 ${buttonToneStyles[tone]}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconToneStyles[tone]}`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          {subtitle && (
            <p className="mt-1 text-xs leading-5 text-slate-300">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}