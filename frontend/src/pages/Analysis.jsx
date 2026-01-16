import { useState, useEffect } from "react";
import { useAuth } from "../auth/authContext";
import DrillDropdown from "../components/drill/drillDropdown";
import AnalysisCard from "../components/analysis/AnalysisCard";

export default function Analyses() {
  const { user } = useAuth();

  const [analyses, setAnalyses] = useState([]);
  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const [showList, setShowList] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserAnalyses = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user) {
          setAnalyses([]);
          setActiveAnalysis(null);
          return;
        }

        const idToken = await user.getIdToken();

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/v1/analysis`,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch analyses: ${response.statusText}`);
        }

        const data = await response.json();

        // Normalize + sort (newest first if createdAt exists)
        const normalizedAnalyses = (data.analyses || [])
          .map((a) => ({
            id: a.id,
            title: a.title || "Swing Analysis",
            drillName: a.drill_name || a.drillName || "", // if present from backend
            status: a.status,
            createdAt: a.createdAt,
            analysisResults: a.analysis_results,
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
  }, [user]);

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
                  key={analysis.id}
                  title={analysis.title}
                  drillName={analysis.drillName}
                  status={analysis.status}
                  createdAt={analysis.createdAt}
                  compact
                  selected={analysis.id === activeAnalysis.id}
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

      {/* Active analysis (focus mode) */}
      {!showList && activeAnalysis && (
        <div className="mt-10 space-y-6">
          <h1 className="text-3xl font-semibold text-slate-100">
            {activeAnalysis.title}
          </h1>

          {/* Top “individual drill/analysis” card */}
          <AnalysisCard
            title={activeAnalysis.title}
            drillName={activeAnalysis.drillName}
            status={activeAnalysis.status}
            createdAt={activeAnalysis.createdAt}
            interactive={false}
          />

          {/* Details */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
            {activeAnalysis.analysisResults ? (
              <>
                <p className="text-slate-300 mb-3 font-medium">Analysis Results</p>
                <pre className="text-xs sm:text-sm text-slate-200/90 whitespace-pre-wrap break-words bg-black/20 rounded-xl p-4 border border-white/10">
                  {JSON.stringify(activeAnalysis.analysisResults, null, 2)}
                </pre>
              </>
            ) : (
              <p className="text-slate-400 text-sm">
                Full analysis details will be displayed here.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
