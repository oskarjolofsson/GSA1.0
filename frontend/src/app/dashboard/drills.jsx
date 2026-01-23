import { useState, useEffect } from "react";
import { useAuth } from "../../auth/authContext";
import DrillCard from "../../components/drill/drillCard";

export default function Drills() {
  const { user } = useAuth();

  const [drills, setDrills] = useState([]);
  const [activeDrill, setActiveDrill] = useState(null);

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
      <div className="w-full max-w-4xl mx-auto px-4 items-center justify-center py-20">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
          <p className="mt-4 text-slate-300">Loading your drills…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 items-center justify-center py-20">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
          <p className="text-red-200">Error loading drills: {error}</p>
        </div>
      </div>
    );
  }

  if (!activeDrill) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 items-center justify-center py-20">
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
    <div className="w-full mx-auto px-4 py-6 flex gap-8">

      {/* Active drill (full-page focus) */}
      <div className="flex-1">
        <h1 className="text-3xl font-semibold text-slate-100 mb-6">
          {/* {activeDrill.name} */}
          Your Drill
        </h1>

        <DrillCard drill={activeDrill} showFull />
      </div>
    </div>
  );
}
