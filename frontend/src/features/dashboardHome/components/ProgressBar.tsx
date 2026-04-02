import { getTrendMeta } from "../utils/getTrendData";
import { motion } from "framer-motion";
import { cn } from "../utils/cn";

export default function ProgressBar({ value, delta }: { value: number; delta?: number }) {
  const meta = getTrendMeta(delta || 0);

  return (
    <div className="w-full">
      <div className="h-2.5 overflow-hidden rounded-full bg-white/8">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full bg-gradient-to-r",
            meta.barClass,
          )}
        />
      </div>
    </div>
  );
}