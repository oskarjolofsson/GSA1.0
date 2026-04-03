import { Check, ListChecks, X } from "lucide-react";

type PracticeActionCardProps = {
  type: "success" | "fail" | "instructions";
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  compact?: boolean;
};

export default function PracticeActionCard({
  type,
  title,
  description,
  onClick,
  disabled = false,
  compact = false,
}: PracticeActionCardProps) {
  const isSuccess = type === "success";
  const isFail = type === "fail";
  const isInstructions = type === "instructions";

  const items = description
    .split(".")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3);

  const styles = isSuccess
    ? {
        border: "border-emerald-400/20",
        bg: "bg-emerald-500/10",
        hover: "hover:border-emerald-300/40 hover:bg-emerald-500/15",
        glow: "bg-[radial-gradient(circle_at_top,_rgba(74,222,128,0.16),_transparent_60%)]",
        iconWrap: "bg-emerald-500 text-slate-950 shadow-emerald-500/30",
        eyebrow: "text-emerald-300/75",
      }
    : isFail
      ? {
          border: "border-rose-400/20",
          bg: "bg-rose-500/10",
          hover: "hover:border-rose-300/40 hover:bg-rose-500/15",
          glow: "bg-[radial-gradient(circle_at_top,_rgba(251,113,133,0.16),_transparent_60%)]",
          iconWrap: "bg-rose-500 text-white shadow-rose-500/25",
          eyebrow: "text-rose-300/75",
        }
      : {
          border: "border-white/10",
          bg: "bg-white/5",
          hover: "hover:border-white/20 hover:bg-white/10",
          glow: "",
          iconWrap: "border border-white/10 bg-white/5 text-white/90",
          eyebrow: "text-white/45",
        };

  const Icon = isSuccess ? Check : isFail ? X : ListChecks;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "relative min-h-0 overflow-hidden rounded-[28px] border text-left",
        "shadow-2xl backdrop-blur-xl transition",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "px-[clamp(0.875rem,2vw,1.5rem)] py-[clamp(0.875rem,2vw,1.5rem)]",
        styles.border,
        styles.bg,
        styles.hover,
      ].join(" ")}
    >
      {styles.glow && <div className={`absolute inset-0 ${styles.glow}`} />}

      <div
        className={[
          "relative flex h-full min-h-0 flex-col",
          compact
            ? "items-center justify-center gap-[clamp(0.5rem,1.8vw,1rem)] text-center"
            : "justify-between",
        ].join(" ")}
      >
        <div
          className={[
            "flex min-h-0",
            compact
              ? "w-full flex-col items-center justify-center gap-[clamp(0.5rem,1.8vw,1rem)]"
              : "items-start gap-[clamp(0.625rem,1.8vw,1rem)]",
          ].join(" ")}
        >
          <div
            className={[
              "flex shrink-0 items-center justify-center rounded-full shadow-lg",
              "h-[clamp(3.25rem,7vw,5rem)] w-[clamp(3.25rem,7vw,5rem)]",
              styles.iconWrap,
            ].join(" ")}
          >
            <Icon
              className="h-[clamp(1.25rem,3vw,2.5rem)] w-[clamp(1.25rem,3vw,2.5rem)]"
              strokeWidth={3}
            />
          </div>

          <div className={compact ? "text-center" : "min-w-0"}>
            <p
              className={[
                "uppercase leading-none",
                "text-[clamp(0.75rem,1.3vw,1rem)] tracking-[0.24em]",
                styles.eyebrow,
              ].join(" ")}
            >
              {title}
            </p>
          </div>
        </div>

        {!compact && items.length > 0 && (
          <div className="mt-[clamp(0.75rem,2vw,1.5rem)] space-y-[clamp(0.5rem,1.4vw,1rem)]">
            {items.map((item, index) => (
              <div key={index} className="flex items-start gap-[clamp(0.5rem,1.2vw,0.875rem)]">
                <div className="mt-[0.2em] flex h-[clamp(1rem,1.8vw,1.35rem)] w-[clamp(1rem,1.8vw,1.35rem)] shrink-0 items-center justify-center rounded-md border border-white/20 text-[clamp(0.55rem,0.9vw,0.7rem)] text-white/60">
                  •
                </div>
                <p className="text-[clamp(0.95rem,1.7vw,1.9rem)] leading-[1.35] text-white/85">
                  {item}
                </p>
              </div>
            ))}
          </div>
        )}

        {compact && (
          <div className="flex flex-col items-center justify-center text-center">
            {isInstructions && (
              <p className="uppercase tracking-[0.22em] text-white/45 text-[clamp(0.72rem,1.1vw,0.95rem)]">
                Instructions
              </p>
            )}
            {/* <p className="mt-1 font-semibold text-white text-[clamp(1.1rem,2.2vw,2rem)] leading-tight">
              Instructions
            </p> */}
          </div>
        )}
      </div>
    </button>
  );
}