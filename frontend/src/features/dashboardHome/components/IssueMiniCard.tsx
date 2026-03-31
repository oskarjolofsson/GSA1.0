import { getTrendMeta } from "../utils/getTrendData";
import { motion } from "framer-motion";
import GlassCard from "./GlassCard";
import ProgressBar from "./ProgressBar";
import { cn } from "../utils/cn";

export default function IssueMiniCard({
  name,
  score,
  trend,
  status,
}: {
  name: string;
  score: number;
  trend: string;
  status: string;
}) {
  const meta = getTrendMeta(trend);
  const Icon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.45 }}
    >
      <GlassCard className="p-4 transition duration-300 hover:-translate-y-1 hover:border-sky-300/20 hover:bg-white/[0.065]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white">{name}</p>
            <p className="mt-1 text-xs text-white/45">Last 5 sessions average</p>
          </div>
          <div className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium", meta.tone)}>
            <Icon className="h-3.5 w-3.5" />
            {meta.label}
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between gap-4">
          <div className="flex-1">
            <ProgressBar value={score} trend={trend} />
            <p className="mt-3 text-sm text-white/55">{status}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-white">{score}</p>
            <p className="text-xs uppercase tracking-[0.22em] text-white/35">Avg</p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}