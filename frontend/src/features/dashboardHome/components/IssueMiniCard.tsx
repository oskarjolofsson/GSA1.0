import { getTrendMeta } from "../utils/getTrendData";
import { motion } from "framer-motion";
import GlassCard from "./GlassCard";
import ProgressBar from "./ProgressBar";
import { cn } from "../utils/cn";
import { getStatus } from "../utils/getStatus";

import { Issue } from "@/features/issues/types";

import { useNavigate } from "react-router-dom";

export default function IssueMiniCard({ issue }: {issue: Issue}) {

  const hasStarted = (issue.progress?.completed_sessions ?? 0) > 0;
  const meta = getTrendMeta(issue.progress?.delta ?? 0);
  const Icon = meta.icon;
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.45 }}
    >
      <GlassCard className="p-4 transition duration-300 hover:-translate-y-1 hover:border-sky-300/20 hover:bg-white/[0.065] hover:cursor-pointer" 
      onClick={() => {
        navigate(`/dashboard/drills/?issueId=${issue.id}`)
      }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white">{issue.title}</p>
            {hasStarted && (
                <p className="mt-1 text-xs text-white/45">Last 5 sessions average</p>
            )}
          </div>
          <div className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium", meta.tone)}>
            <Icon className="h-3.5 w-3.5" />
            {hasStarted ? meta.label : "Not Started Yet"}
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between gap-4">
          {hasStarted ? (
            <>
              <div className="flex-1">
                <ProgressBar value={Math.floor((issue.progress?.recent_session_success_rates ?? 0) * 100)} delta={issue.progress?.delta ?? 0}/>
                <p className="mt-3 text-sm text-white/55">{getStatus(issue.progress?.delta ?? 0)}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold text-white">{Math.floor((issue.progress?.recent_session_success_rates ?? 0) * 100)}</p>
                <p className="text-xs uppercase tracking-[0.22em] text-white/35">Avg</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-white/55">Not Started Yet</p>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}