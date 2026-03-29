import { Search, Lightbulb, Brain } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Custom hooks
import useResultNavigation from '../hooks/useResultNavigation';

// Import Components
import ResultHeroCard from "./resultHero";
import VideoDemo from "./videoDemo";

// Types
import type { AnalysisWithIssues } from '../types';
import type { Issue } from '../../issues/types';

interface ResultBoxProps {
    analysis: AnalysisWithIssues | null;
    issue: (Issue & { confidence?: number }) | null;
    totalIssues: number;
    video_url: string | null;
    activeProblem: number;
    setActiveProblem: (index: number) => void;
}


const SEVERITY_COLORS = {
  border: {
    high: "border-red-400",
    medium: "border-yellow-400",
    low: "border-green-400"
  },
  borderInactive: {
    high: "border-red-400/25",
    medium: "border-yellow-400/25",
    low: "border-green-400/25"
  },
  header: {
    high: { border: "border-red-500/20", bg: "bg-red-500/10", text: "text-red-400" },
    medium: { border: "border-yellow-500/20", bg: "bg-yellow-500/10", text: "text-yellow-400" },
    low: { border: "border-green-500/20", bg: "bg-green-500/10", text: "text-green-400" }
  },
  gradient: {
    high: "from-red-400/40 to-red-300/40",
    medium: "from-yellow-400/40 to-yellow-300/40",
    low: "from-green-400/40 to-green-300/40"
  }
};

const TAB_CONFIGS = {
  what: { icon: Search, label: "What you did" },
  why: { icon: Brain, label: "Why it matters" },
  try: { icon: Lightbulb, label: "Try this" }
};

export default function ResultBox({ analysis, issue, totalIssues, video_url, activeProblem, setActiveProblem }: ResultBoxProps) {
  const navigate = useNavigate();

  const {
    direction,
    onNextIssue,
    onPreviousIssue,
  } = useResultNavigation(activeProblem, setActiveProblem, totalIssues);

  if (!analysis || !issue) return null;

  return (
    <>
      {/* Asymmetric grid: 2fr card, 1fr video. Stacks on mobile */}
      <div className="w-full max-w-5xl mx-auto px-1 md:px-4 sm:px-6 lg:px-8 mt-1 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 items-start pb-[max(2px,env(safe-area-inset-bottom))] lg:pb-0">
        <div className="w-full flex justify-center overflow-hidden">
          <motion.div
            key={activeProblem}
            initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full"
          >
            <ResultHeroCard
              prioNumber={activeProblem + 1}
              totalIssues={totalIssues}
              issue={issue}
              onClickDrill={
                issue.analysis_issue_id
                  ? () => navigate(`/dashboard/drills/?issueId=${issue.id}`)
                  : undefined
              }
              onNextIssue={onNextIssue}
              onPreviousIssue={onPreviousIssue}
            />
          </motion.div>
        </div>

        {/* Video under card on mobile, right column on desktop */}
        <div className="w-full lg:self-start mb-4">
          <VideoDemo url={video_url} />
        </div>
      </div>
    </>
  );
}
