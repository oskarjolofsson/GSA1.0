import { useState } from "react";
import { ListChevronsUpDown, LandPlot, AlertTriangle, AlertCircle, Info, Search, Lightbulb, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"

export default function InfoBox({ analysis }) {
  console.log("from inside result-box.jsx", analysis);

  if (!analysis) return null;

  const { quick_summary, key_findings } = analysis;

  const { diagnosis, key_fix } = quick_summary;

  const [activeProblem, setActiveProblem] = useState(0);
  const [activeTab, setActiveTab] = useState("what");



  return (
    <section
      aria-label="Quick Summary"
      className={[
        // container
        "rounded-2xl border shadow-lg",
        // minimal, dark-friendly palette
        "bg-white/5 border-white/10 text-white/90",
        // roomy
        "p-6 md:p-8",
      ].join(" ")}
    >

      {/* Summary Header */}
      <div className="flex items-center gap-2 mb-4">
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
        {/* Card Diagnosis */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-4">
          <header className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/90">Diagnosis</h3>
            <span className="text-[10px] uppercase tracking-wide text-white/50">
              Quick take
            </span>
          </header>
          <p className="text-base leading-relaxed text-white/90">
            {diagnosis}
          </p>
        </section>

        {/* Card Key Fix */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-4">
          <header className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/90">Key Fix</h3>
            <span className="text-[10px] uppercase tracking-wide text-white/50">
              Action
            </span>
          </header>
          <p className="text-base leading-relaxed text-white/90">
            {key_fix}
          </p>
        </section>
      </div>

      {/* Advanced */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6 items-center">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15"
          >
            <span className="text-xs">
              <ListChevronsUpDown className="w-3 h-3" />
            </span>
          </span>
          <div className="text-xs uppercase tracking-wide text-white/60">
            Key fix
          </div>
        </div>

        {/* <div></div> */}

        {/* Number Row */}
        <div className="flex items-center gap-2">
          {key_findings.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveProblem(i)}
              className={`
              inline-flex h-8 w-8 items-center justify-center rounded-full border 
              transition-all duration-300 
              ${activeProblem === i
                  ? "border-white/40 bg-white/20 text-white"
                  : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10"}
            `}
            >
              {i + 1}
            </button>
          ))}

        </div>

        {/* <div></div>  */}

        {/* Text to explain that the buttons toggle the expandable content below */}
        <div className="text-xs text-white/60">
          Tap numbers to see key findings
        </div>
      </div>

      {/* Key insights */}
      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 ">
        <div
          className={`
          overflow-hidden transition-all duration-300 
          ${activeProblem !== null ? "" : "max-h-0 opacity-0"}
        `}
        >
          {activeProblem !== null && (
            <div className="space-y-3">
              <div className="relative mb-4">

                {/* Top-right severity icon */}
                <div className="absolute top-0 left-0">
                  {headerIcon({ severity: key_findings[activeProblem].severity })}
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
                        max-w-[80%] md:max-w-[60%] break-words
                      "
                    >
                      {key_findings[activeProblem].title}
                    </motion.h3>
                  </AnimatePresence>

                  <div className="h-[1px] w-12 bg-white/10 rounded-full" />
                </div>

              </div>

              {/* Cards showing what you did, why it matters, try this */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">

                {/* What you did */}
                <div className="relative rounded-lg border border-white/10 bg-white/5 p-4 space-y-2 text-center">
                  {/* Icon */}
                  <div className="absolute top-2 right-2 text-xs text-white/50 italic">
                    <Search />
                  </div>

                  <p className="text-xs font-semibold text-white/60">What you did</p>
                  <p className="text-sm text-white/80 leading-relaxed">
                    {key_findings[activeProblem].what_you_did}
                  </p>
                </div>
            
                {/* Why it matters */}
                <div className="relative rounded-lg border border-white/10 bg-white/5 p-4 space-y-2 text-center">
                  <div className="absolute top-2 right-2 text-xs text-white/50 italic">
                    <Brain />
                  </div>

                  <p className="text-xs font-semibold text-white/60">Why it matters</p>
                  <p className="text-sm text-white/80 leading-relaxed">
                    {key_findings[activeProblem].why_it_matters}
                  </p>
                </div>

                {/* Try this */}
                <div className="relative rounded-lg border border-white/10 bg-white/5 p-4 space-y-2 text-center">
                  <div className="absolute top-2 right-2 text-xs text-white/50 italic">
                    <Lightbulb />
                  </div>
                  <p className="text-xs font-semibold text-white/60">Try this</p>
                  <p className="text-sm text-white/90 leading-relaxed font-medium">
                    {key_findings[activeProblem].try_this}
                  </p>
                </div>

              </div>

            </div>
          )}
        </div>

      </div>
    </section>
  );
}

function headerIcon({ severity }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="inline-block px-2 py-1 rounded text-xs font-medium uppercase tracking-wide"
        style={{
          backgroundColor: severity === "high" ? "rgba(239, 68, 68, 0.2)" :
            severity === "medium" ? "rgba(245, 158, 11, 0.2)" :
              "rgba(34, 197, 94, 0.2)",
          color: severity === "high" ? "rgb(248, 113, 113)" :
            severity === "medium" ? "rgb(251, 191, 36)" :
              "rgb(74, 222, 128)"
        }}
      >
        {severity === "high" ? <AlertTriangle className="inline w-4 h-4 mr-1" /> :
          severity === "medium" ? <AlertCircle className="inline w-4 h-4 mr-1" /> :
            <Info className="inline w-4 h-4 mr-1" />
        }
      </span>
    </div>
  )
}