import { useEffect, useState } from "react";
import {Search, Lightbulb, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"

// Import Components
import ResultHeroCard from "./summary/resultHero";
import VideoDemo from "./summary/videoDemo";
import { fileTransferService } from "../../services/fileTransferService";

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

export default function InfoBox({ analysis }) {

  if (!analysis) return null;

  const { quick_summary, key_findings } = analysis;
  const file = fileTransferService.getFile();

  const [activeProblem, setActiveProblem] = useState(0);
  const [activeTab, setActiveTab] = useState("what");

  useEffect(() => {
    // Reset to first problem when analysis changes
    setActiveTab("what");
  }, [activeProblem]);



  return (
    <>
      {/* Grid with Hero Card to the left and Video Player to the right. if to small screen stack vertically */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ResultHeroCard
          prioNumber={activeProblem + 1}
          problemName={key_findings[activeProblem].title}
          diagnosis={key_findings[activeProblem].diagnosis}
          impactLine={key_findings[activeProblem].why_it_matters}
        />

        {/* Placeholder for video player */}
        <VideoDemo />

      </div>
      

    </>
  );
}