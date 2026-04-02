import { cn } from "../utils/cn";

export default function GlassCard({
  className = "",
  children,
  onClick,
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {

  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/10 bg-white/[0.05] shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}