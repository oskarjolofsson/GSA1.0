import { useState, useEffect } from "react";
import { useAuth } from "../auth/authContext";
import DrillDropdown from "../components/drillDropdown/drillDropdown";

export default function Drills() {
  const { user } = useAuth();

  const [drills, setDrills] = useState([]);
  const [activeDrill, setActiveDrill] = useState(null);
  const [showList, setShowList] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserDrills = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user) {
          setDrills([]);
          setActiveDrill(null);
          return;
        }

        const idToken = await user.getIdToken();

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/v1/drills`,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch drills: ${response.statusText}`);
        }

        const data = await response.json();

        const normalizedDrills = (data.drills || []).map((d) => ({
          id: d.id,
          name: "Practice Drill",
          drill: d.drill,
          analysisId: d.analysis_id,
          thumbnailUrl: d.image_url,
        }));

        setDrills(normalizedDrills);
        setActiveDrill(normalizedDrills[0] || null); // default = most recent
      } catch (err) {
        console.error("Error fetching drills:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDrills();
  }, [user]);

  /* -------------------- Loading / Error States -------------------- */

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
          <p className="mt-4 text-slate-300">Loading your drills…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
          <p className="text-red-200">Error loading drills: {error}</p>
        </div>
      </div>
    );
  }

  if (!activeDrill) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
          <h2 className="text-2xl font-semibold text-slate-100 mb-2">
            No Drills Yet
          </h2>
          <p className="text-slate-400 mb-6">
            Upload a swing to generate your first drill
          </p>
          <a
            href="/dashboard"
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
      {/* Drill selector */}
      <div
        onClick={() => setShowList((prev) => !prev)}
        className="w-full mb-4 cursor-pointer select-none"
        role="button"
        aria-expanded={showList}
      >
        <DrillDropdown
          header="Current Drills"
        />
      </div>

      {/* Drill list (dropdown mode) */}
      {showList && (
        <div className="mt-4">
          {/* Outer container */}
          <div
            className="
              rounded-2xl
              border border-slate-700/60
              bg-slate-900/70
              backdrop-blur-sm
              shadow-lg
            "
          >
            {/* Scrollable inner area */}
            <div
              className="
                max-h-[50vh]
                overflow-y-auto
                overscroll-contain
                no-scrollbar
                p-2
                space-y-2
              "
            >
              {drills.map((drill) => (
                <button
                  key={drill.id}
                  onClick={() => {
                    setActiveDrill(drill);
                    setShowList(false);
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition
                    ${
                      drill.id === activeDrill.id
                        ? "bg-blue-600/20 border-blue-500"
                        : "bg-slate-800 border-slate-700 hover:bg-slate-700"
                    }
                  `}
                >
                  <div className="font-medium text-slate-100">
                    {drill.name}
                  </div>
                  <div className="text-sm text-slate-400 truncate">
                    {drill.drill}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}



      {/* Active drill (full-page focus) */}
      {!showList && activeDrill && (
      <div className="mt-10">
        <h1 className="text-3xl font-semibold text-slate-100 mb-6">
          {activeDrill.name}
        </h1>

        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
          <p className="text-lg text-slate-200 leading-relaxed">
            {activeDrill.drill}
          </p>
        </div>
      </div>
      )}
    </div>
      
  );
}
