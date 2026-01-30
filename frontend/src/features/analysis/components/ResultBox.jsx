import { useEffect, useState } from "react";
import { Search, Lightbulb, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Custom hooks
import useResultNavigation from '../hooks/useResultNavigation';

// Import Components
import ResultHeroCard from "./resultHero";
import VideoDemo from "./videoDemo";
import DrillPopup from "../../../shared/components/popup/drillPopup";


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

export default function ResultBox({ analysis, issue, totalIssues, video_url, activeProblem, setActiveProblem }) {

  if (!analysis || !issue) return null;

  const {
    direction,
    onNextIssue,
    onPreviousIssue,
  } = useResultNavigation(activeProblem, setActiveProblem, totalIssues);

  return (
    <>
      {/* Asymmetric grid: 2fr card, 1fr video. Stacks on mobile */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 items-start">
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
              problemName={issue.title}
              diagnosis={issue.what_is_happening}
              impactLine={issue.what_should_happen}
              onClickDrill={() => {
                // Do nothing
              }}
              onNextIssue={onNextIssue}
              onPreviousIssue={onPreviousIssue}
            />
          </motion.div>
        </div>

        {/* Video constrained to match card height */}
        <VideoDemo url={video_url} />
      </div>
    </>
  );
}
