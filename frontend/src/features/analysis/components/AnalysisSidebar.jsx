import { useState } from "react";
import { ChevronRight, ChevronLeft, Calendar, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AnalysisSidebar({ allAnalyses, activeAnalysis, onSelectAnalysis }) {
  const [isOpen, setIsOpen] = useState(true);

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Toggle button - visible when sidebar is closed */}
      {!isOpen && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setIsOpen(true)}
          className="fixed right-4 top-4 z-40 rounded-xl bg-[#0e1428]/80 backdrop-blur-md border border-white/10 p-3 text-slate-400 hover:text-slate-200 hover:bg-[#0e1428]/90 transition-all shadow-lg"
          aria-label="Open analyses sidebar"
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>
      )}

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed right-0 top-0 h-screen w-80 bg-[#0e1428]/95 backdrop-blur-md border-l border-white/10 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-slate-100">
                  Your Analyses
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                aria-label="Close sidebar"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Analyses list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {allAnalyses.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No analyses yet
                </div>
              ) : (
                allAnalyses.map((analysis) => {
                  const isActive =
                    activeAnalysis?.analysis_id === analysis.analysis_id;

                  return (
                    <button
                      key={analysis.analysis_id}
                      onClick={() => onSelectAnalysis(analysis.analysis_id)}
                      className={`w-full text-left rounded-xl p-4 transition-all ${
                        isActive
                          ? "bg-emerald-500/10 border-2 border-emerald-500/30"
                          : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
                      }`}
                    >
                      {/* Date header */}
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs text-slate-400 font-medium">
                          
                          {formatTime(analysis.createdAt)}
                        </span>
                      </div>

                      {/* Time */}
                      <div className="text-sm text-slate-300 font-semibold mb-1">
                        {formatDate(analysis.createdAt)}
                      </div>

                      {/* Analysis ID (truncated) */}
                      <div className="text-xs text-slate-500 font-mono truncate">
                        
                      </div>

                      {/* Active indicator */}
                      {isActive && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-xs text-emerald-400 font-medium">
                            Active
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer info */}
            <div className="p-4 border-t border-white/10">
              <div className="text-xs text-slate-500 text-center">
                {allAnalyses.length} {allAnalyses.length === 1 ? "analysis" : "analyses"} total
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
