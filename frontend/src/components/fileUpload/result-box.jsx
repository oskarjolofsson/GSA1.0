import { useEffect, useState } from "react";
import { ListChevronsUpDown, LandPlot, AlertTriangle, AlertCircle, Info, Search, Lightbulb, Brain, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"

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
  console.log("from inside result-box.jsx", analysis);

  if (!analysis) return null;

  const { quick_summary, key_findings } = analysis;

  const { diagnosis, key_fix } = quick_summary;

  const [activeProblem, setActiveProblem] = useState(0);
  const [activeTab, setActiveTab] = useState("what");

  useEffect(() => {
    // Reset to first problem when analysis changes
    setActiveTab("what");
  }, [activeProblem]);

  const getSeverityBorder = (severity, isActive) => {
    return isActive ? SEVERITY_COLORS.border[severity] : SEVERITY_COLORS.borderInactive[severity];
  };

  const renderSummaryCard = (title, icon, content, gradient) => (
    <section className="relative rounded-xl border border-white/10 bg-white/5 p-5">
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b ${gradient}`} />
      <header className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold text-white/95">
          {icon}
          {title}
        </h3>
        <span className="text-[10px] uppercase tracking-wide text-white/50">
          {title === "Diagnosis" ? "Quick Take" : "Action"}
        </span>
      </header>
      <p className="text-[15px] text-white/85 leading-relaxed">{content}</p>
    </section>
  );

  const renderProblemButton = (index, severity) => (
    <button
      key={index}
      onClick={() => setActiveProblem(index)}
      className={`
        inline-flex h-8 w-8 items-center justify-center rounded-full border
        transition-all duration-300
        ${activeProblem === index
          ? `${getSeverityBorder(severity, true)} bg-white/20 text-white`
          : `${getSeverityBorder(severity, false)} bg-white/5 text-white/70 hover:bg-white/10`
        }
      `}
    >
      {index + 1}
    </button>
  );

  const renderTabButton = (tabName, isActive) => {
    const { icon: Icon, label } = TAB_CONFIGS[tabName];
    return (
      <button
        key={tabName}
        onClick={() => setActiveTab(tabName)}
        className={`
          flex flex-col items-center justify-center gap-1 py-3 rounded-lg border
          transition-all duration-200
          ${isActive
            ? "border-white/20 bg-white/10"
            : "border-white/5 bg-white/0 hover:bg-white/5"
          }
        `}
      >
        <Icon className="w-4 h-4 text-white/70" />
        <span className="text-xs text-white/70">{label}</span>
      </button>
    );
  };

  const renderTabContent = (tabName) => {
    const contentKey = tabName === "what" ? "what_you_did" : tabName === "why" ? "why_it_matters" : "try_this";
    const content = key_findings[activeProblem][contentKey];

    return (
      <motion.div
        key={tabName}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.25 }}
        className="rounded-lg border border-white/10 bg-white/5 p-4 text-white/80"
      >
        {content}
      </motion.div>
    );
  };

  const handlePreviousProblem = () => {
    setActiveProblem((prev) => (prev > 0 ? prev - 1 : key_findings.length - 1));
  };

  const handleNextProblem = () => {
    setActiveProblem((prev) => (prev < key_findings.length - 1 ? prev + 1 : 0));
  };



  return (
    <>
      <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center">Analysis Results</h1>

      <section
        aria-label="Quick Summary"
        className={[
          "rounded-2xl border shadow-lg",
          "bg-white/5 border-white/10 text-white/90",
          "p-6 md:p-8",
        ].join(" ")}
      >
        {/* Summary Header */}
        <div className="gap-2 mb-4 justify-center flex items-center">
          <span
            aria-hidden
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15"
          >
            <span className="text-xs">
              <LandPlot className="w-3 h-3" />
            </span>
          </span>
          <div className="text-xs uppercase tracking-wide text-white/60">
            Summary
          </div>
        </div>

        {/* Two cards: side-by-side on md+, stacked on small */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {renderSummaryCard(
            "Diagnosis",
            <Clock className="w-4 h-4 text-purple-300" />,
            diagnosis,
            "from-purple-400/40 to-purple-300/40"
          )}
          {renderSummaryCard(
            "Key Fix",
            <Lightbulb className="w-4 h-4 text-sky-300" />,
            key_fix,
            "from-sky-400/40 to-sky-300/40"
          )}
        </div>

        {/* Line */}
        <div className="my-6 h-px w-full bg-white/10 rounded-full" />

        {/* Advanced */}
        <div className="mt-6">

          <div className="gap-2 mb-4 justify-center flex items-center">
            <span
              aria-hidden
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15"
            >
              <span className="text-xs">
                <ListChevronsUpDown className="w-3 h-3" />
              </span>
            </span>
            <div className="text-xs uppercase tracking-wide text-white/60">
              Problems Found With Recommendations
            </div>
          </div>

          {/* Number Row and Navigation */}
          <div className="flex flex-col gap-4 items-center justify-center">

            {/* Problem Indicators */}
            <div className="flex items-center gap-2">
              {key_findings.map((_, i) => renderProblemButton(i, key_findings[i].severity))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-4 md:gap-6">
              <motion.button
                onClick={handlePreviousProblem}
                className="h-8 w-8 md:h-10 md:w-10 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/80
                           transition-all duration-200 hover:bg-white/10 flex-shrink-0"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Previous problem"
                type="button"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
              </motion.button>

              <motion.button
                onClick={handleNextProblem}
                className="h-8 w-8 md:h-10 md:w-10 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/80
                           transition-all duration-200 hover:bg-white/10 flex-shrink-0"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Next problem"
                type="button"
              >
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Key insights */}
        <div className="mt-8">
          <div
            className={`
          overflow-hidden transition-all duration-300 
          ${activeProblem !== null ? "" : "max-h-0 opacity-0"}
        `}
          >
            {activeProblem !== null && (
              <div className="space-y-3">
                <div className="flex flex-col items-center mb-4">

                  {/* Severity icon row */}
                  <div className="mb-2">
                    {headerIcon({
                      severity: key_findings[activeProblem].severity,
                      key: activeProblem
                    })}
                  </div>


                  {/* Title + divider */}
                  <div className="flex flex-col items-center text-center space-y-2">
                    <AnimatePresence mode="wait">
                      <motion.h3
                        key={key_findings[activeProblem].title} // important!
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="
                        text-lg font-semibold text-white/90 text-center
                        
                      "
                      >
                        {key_findings[activeProblem].title}
                      </motion.h3>
                    </AnimatePresence>

                    <div className="h-[1px] w-12 bg-white/10 rounded-full" />
                  </div>

                </div>

                {/* Cards showing what you did, why it matters, try this */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeProblem}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="grid grid-cols-3 gap-3 mt-6">
                      {renderTabButton("what", activeTab === "what")}
                      {renderTabButton("why", activeTab === "why")}
                      {renderTabButton("try", activeTab === "try")}
                    </div>

                    <div className="mt-4 relative text-center">
                      <AnimatePresence mode="wait">
                        {activeTab === "what" && renderTabContent("what")}
                        {activeTab === "why" && renderTabContent("why")}
                        {activeTab === "try" && renderTabContent("try")}
                      </AnimatePresence>
                    </div>

                  </motion.div>

                  <motion.div
                    layout
                    className="flex justify-center mt-4"
                  >
                    {activeTab !== "try" && (
                      <motion.button
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{
                          scale: 1,
                          opacity: 1,
                          // Spring physics usually doesn't need duration, 
                          // it uses stiffness and damping
                          transition: {
                            type: "spring",
                            stiffness: 200,
                            damping: 15
                          }
                        }}
                        exit={{ scale: 0.5, opacity: 0 }}

                        onClick={() => {
                          if (activeTab === "what") setActiveTab("why");
                          if (activeTab === "why") setActiveTab("try");
                        }}

                        className={`
                        text-xs px-4 py-2 rounded-full
                        bg-white/10 border border-white/10 text-white/80
                        backdrop-blur-md
                        hover:bg-white/20 transition
                      `}
                      >
                        Next →
                      </motion.button>
                    )}
                  </motion.div>
                </AnimatePresence>



              </div>
            )}
          </div>

        </div>
      </section>
    </>
  );
}

function headerIcon({ severity, key }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.25 }}>
        <div
          className={`
            inline-flex items-center justify-center
            w-10 h-10 rounded-lg border 
            backdrop-blur-md shadow-md
            ${severity === "high" ? "border-red-500/20 bg-red-500/10" :
              severity === "medium" ? "border-yellow-500/20 bg-yellow-500/10" :
                "border-green-500/20 bg-green-500/10"}
          `}
        >
          {severity === "high" ? (
            <AlertTriangle className="w-5 h-5 text-red-400" />
          ) : severity === "medium" ? (
            <AlertCircle className="w-5 h-5 text-yellow-400" />
          ) : (
            <Info className="w-5 h-5 text-green-400" />
          )}
        </div>
      </motion.div>
    </AnimatePresence>

  )
}