import { useState, useEffect } from "react";
import DrillDropdown from "../components/drill/drillDropdown";
import AnalysisCard from "../components/analysis/AnalysisCard";
import pastDrillService from "../services/pastDrillService";
import SharePopup from "../components/popup/SharePopup";
import ResultBox from "../components/result/result-box.jsx";

import { Share2 } from "lucide-react";


export default function Analyses() {

  const [analyses, setAnalyses] = useState([]);
  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const [showList, setShowList] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoURL, setVideoURL] = useState(null);
  const [videoURLCache, setVideoURLCache] = useState({}); // Cache: analysisId -> videoUrl
  const [showSharePopup, setShowSharePopup] = useState(false);

  const share_button_url = window.location.origin + "/dashboard/analyse/" + (activeAnalysis ? activeAnalysis.analysis_id : "");

  useEffect(() => {
    const fetchUserAnalyses = async () => {
      try {
        setLoading(true);
        setError(null);

        const analyses = await pastDrillService.getAnalysesForUser();

        // Normalize + sort (newest first if createdAt exists)
        const normalizedAnalyses = analyses
          .map((a) => ({
            id: a.analysis_id,
            title: a.title || "Swing Analysis",
            drillName: a.drill_name || a.drillName || "", // if present from backend
            status: a.status,
            createdAt: a.createdAt,
            analysisResults: a.analysis_results,
            video_key: a.video_key, // Preserve video_key for URL fetching
          }))
          .sort((x, y) => {
            const dx = new Date(x.createdAt || 0).getTime();
            const dy = new Date(y.createdAt || 0).getTime();
            return dy - dx;
          });

        setAnalyses(normalizedAnalyses);
        setActiveAnalysis(normalizedAnalyses[0] || null);
      } catch (err) {
        console.error("Error fetching analyses:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAnalyses();
  }, []);

  // Fetch video URL for active analysis with caching
  useEffect(() => {
    const fetchVideoURL = async () => {
      if (!activeAnalysis) {
        setVideoURL(null);
        return;
      }

      // Check cache first
      if (videoURLCache[activeAnalysis.analysis_id]) {
        console.log("Using cached video URL for analysis:", activeAnalysis.analysis_id);
        setVideoURL(videoURLCache[activeAnalysis.analysis_id]);
        return;
      }

      // If no video_key, can't fetch URL
      if (!activeAnalysis.video_key) {
        console.warn("No video_key available for analysis:", activeAnalysis.id);
        setVideoURL(null);
        return;
      }

      try {
        console.log("Fetching video URL for analysis:", activeAnalysis.analysis_id);
        const url = await pastDrillService.getAnalysisVideoURL(
          activeAnalysis.analysis_id,
          activeAnalysis.video_key
        );
        setVideoURL(url);

        // Store in cache
        setVideoURLCache((prev) => ({
          ...prev,
          [activeAnalysis.analysis_id]: url,
        }));
      } catch (err) {
        console.error("Error fetching video URL:", err);
        setVideoURL(null);
      }
    };

    fetchVideoURL();
  }, [activeAnalysis, videoURLCache]);


  /* -------------------- Loading / Error States -------------------- */

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
          <p className="mt-4 text-slate-300">Loading your analyses…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
          <p className="text-red-200">Error loading analyses: {error}</p>
        </div>
      </div>
    );
  }

  if (!activeAnalysis) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
          <h2 className="text-2xl font-semibold text-slate-100 mb-2">
            No Analyses Yet
          </h2>
          <p className="text-slate-400 mb-6">
            Upload a swing to generate your first analysis
          </p>
          <a
            href="/dashboard/upload"
            className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            Upload Swing
          </a>
        </div>
      </div>
    );
  }

  /* -------------------- Main UI -------------------- */

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Analysis selector */}
      <div
        onClick={() => setShowList((prev) => !prev)}
        className="w-full mb-4 cursor-pointer"
        role="button"
        aria-expanded={showList}
      >
        <DrillDropdown header="Your Analyses" />
      </div>

      {/* Analysis list (dropdown mode) */}
      {showList && (
        <div className="mt-4">
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-sm shadow-lg">
            <div className="max-h-[50vh] overflow-y-auto overscroll-contain no-scrollbar p-2 space-y-2">
              {analyses.map((analysis) => (
                <AnalysisCard
                  key={analysis.analysis_id}
                  title={analysis.title}
                  drillName={analysis.drillName}
                  status={analysis.status}
                  createdAt={analysis.createdAt}
                  compact
                  selected={analysis.analysis_id === activeAnalysis.analysis_id}
                  onClick={() => {
                    setActiveAnalysis(analysis);
                    setShowList(false);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Analysis results */}

      {activeAnalysis && !showList && (
        <>
          {/* Show share button for viewing own analysis */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setShowSharePopup(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <Share2 size={20} />
              Share
            </button>
          </div>
          <ResultBox analysis={activeAnalysis.analysisResults} video_url={videoURL} />
        </>
      )}

      {showSharePopup && (
        <SharePopup
          shareUrl={share_button_url}
          onClose={() => setShowSharePopup(false)}
        />
      )}

    </div>
  );
}
