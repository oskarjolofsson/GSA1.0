import { use, useEffect, useState } from "react";
import {Search, Lightbulb, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"

// Import Components
import ResultHeroCard from "./resultHero";
import VideoDemo from "./videoDemo";
import { fileTransferService } from "../../../services/fileTransferService";
import pastDrillService from "../../../services/pastDrillService";
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

export default function ResultBox({ analysis, video_url, drill_image_url, activeProblem, setActiveProblem, drill_image_loading, drill_image_timeout }) {

  if (!analysis) return null;

  const { quick_summary, key_findings } = analysis;

  const [drillPopupOpen, setDrillPopupOpen] = useState(false);
  const [direction, setDirection] = useState(0);
  const [drillImage, setDrillImage] = useState(null);

  useEffect(() => {
    // Reset to first problem when analysis changes
    setActiveTab("what");
  }, [activeProblem]);

  useEffect(() => {
    // Fetch drill image when activeProblem changes
    const fetchDrillImage = async () => {
      try {
        const currentKeyFinding = key_findings[activeProblem];
        if (currentKeyFinding?.drill_id) {
          const drill = await pastDrillService.getDrill(currentKeyFinding.drill_id);
          setDrillImage(drill?.image_url || null);
        } else {
          setDrillImage(null);
        }
      } catch (error) {
        console.error("Error fetching drill image:", error);
        setDrillImage(null);
      }
    };

    fetchDrillImage();
  }, [activeProblem, key_findings]);

  const handleDrillOpen = (index) => {
    setDrillPopupOpen(true);
  }

  const handleDrillClose = () => {
    setDrillPopupOpen(false);
  }

  const onNextDrill = () => {
    if (activeProblem < key_findings.length - 1) {
      setDirection(1);
      setActiveProblem(activeProblem + 1);
    }
    else return null;
  };

  const onPreviousDrill = () => {
    if (activeProblem > 0) {
      setDirection(-1);
      setActiveProblem(activeProblem - 1);
    }
    else return null;
  };

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
              problemName={key_findings[activeProblem].title}
              diagnosis={key_findings[activeProblem].what_you_did}
              impactLine={key_findings[activeProblem].why_it_matters}
              onClickDrill={() => handleDrillOpen(activeProblem)}
              onNextDrill={activeProblem < key_findings.length - 1 ? onNextDrill : null}
              onPreviousDrill={activeProblem > 0 ? onPreviousDrill : null}
            />
          </motion.div>
        </div>

        {/* Video constrained to match card height */}
        <VideoDemo url={video_url} />
      </div>
      
      
      <DrillPopup
        drill={drillPopupOpen ? key_findings[activeProblem]["try_this"] : null}
        image={drillImage || (file ? file.previewImage : null)}
        onClose={handleDrillClose}
        isLoading={drill_image_loading}
        isTimeout={drill_image_timeout}
      />

    </>
  );
}
