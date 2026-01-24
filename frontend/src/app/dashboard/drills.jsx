import { useState, useEffect } from "react";
import { useAuth } from "../../auth/authContext";

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

  // if (loading) {
  //   return (
  //     <div className="w-full max-w-4xl mx-auto px-4 items-center justify-center py-20">
  //       <div className="text-center py-12">
  //         <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
  //         <p className="mt-4 text-slate-300">Loading your drills…</p>
  //       </div>
  //     </div>
  //   );
  // }

  // if (error) {
  //   return (
  //     <div className="w-full max-w-4xl mx-auto px-4 items-center justify-center py-20">
  //       <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
  //         <p className="text-red-200">Error loading drills: {error}</p>
  //       </div>
  //     </div>
  //   );
  // }

  // if (!activeDrill) {
  //   return (
  //     <div className="w-full max-w-4xl mx-auto px-4 items-center justify-center py-20">
  //       <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
  //         <h2 className="text-2xl font-semibold text-slate-100 mb-2">
  //           No Drills Yet
  //         </h2>
  //         <p className="text-slate-400 mb-6">
  //           Upload a swing to generate your first drill
  //         </p>
  //         <a
  //           href="/dashboard"
  //           className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
  //         >
  //           Upload Swing
  //         </a>
  //       </div>
  //     </div>
  //   );
  // }

  /* -------------------- Main UI -------------------- */
  return (
    <DrillPage />
  );
}


function DrillPage() {
  const total = 15;
  const succeeded = 7;
  const failed = 3;

  const succeededPercent = (succeeded / total) * 100;
  const failedPercent = (failed / total) * 100;

  return (
    <div className="min-h-screen text-slate-100 reminder p-6 flex flex-col">

      {/* Top Progress bar */}
      {/* <div className="relative w-full h-2 bg-neutral-700 rounded-full overflow-hidden mb-12">
        <div
          className="absolute top-0 left-0 h-full bg-green-600 rounded-full"
          style={{ width: `${succeededPercent}%` }}
        />
        <div
          className="absolute top-0 right-0 h-full bg-red-600 rounded-full"
          style={{ width: `${failedPercent}%` }}
        />
      </div> */}

      <SuccessFailureProgress
        succeeded={succeeded}
        failed={failed}
        total={total}
      />
      
      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        
        {/* Drill image / video */}
        <div className="rounded-xl border border-neutral-700 bg-neutral-800 aspect-video flex items-center justify-center text-neutral-400 max-h-[250px] mx-auto w-full md:mx-0">
          Drill image / video
        </div>

        {/* Explanation */}
        <div className="flex flex-col justify-center text-center md:text-left">
          <h1 className="text-2xl font-semibold mb-3">
            Title
          </h1>
          <p className="text-neutral-300 leading-relaxed">
            Description. Explain how to execute the drill
          </p>
        </div>
      </div>

      {/* Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        
        {/* Fault indicator */}
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-xl">
            ✕
          </div>
          <div>
            <p className="font-medium text-red-400">Fault indicator</p>
            <p className="text-sm text-neutral-400">
              What signals that the drill is being done incorrectly.
            </p>
          </div>
        </div>

        {/* Success indicator */}
        <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-xl">
            ✓
          </div>
          <div>
            <p className="font-medium text-green-400">Success indicator</p>
            <p className="text-sm text-neutral-400">
              What confirms the drill is executed correctly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessFailureProgress({ succeeded, failed, total }) {
  const succeededPercent =
    total > 0 ? Math.round((succeeded / total) * 100) : 0;
  const failedPercent =
    total > 0 ? Math.round((failed / total) * 100) : 0;

  return (
    <div className="w-full mb-6">
      {/* Card container */}
      <div className="rounded-xl border border-neutral-700 bg-neutral-800/50 px-6 py-2">
        <div className="flex items-center justify-between mb-4">
          {/* Success section */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-sm font-bold">
              {succeeded}
            </div>
            <div>
              <div className="text-sm font-medium text-green-400">Success</div>
              <div className="text-xs text-neutral-400">{succeededPercent}%</div>
            </div>
          </div>

          {/* Total in center */}
          <div className="text-center">
            <div className="text-2xl font-semibold text-slate-100">
              {succeeded + failed} / {total}
            </div>
            <div className="text-xs text-neutral-400">Completed</div>
          </div>

          {/* Failed section */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-red-400">Failed</div>
              <div className="text-xs text-neutral-400">{failedPercent}%</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-sm font-bold">
              {failed}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative w-full h-3 bg-neutral-700 rounded-full overflow-hidden">
          {/* Green from left */}
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-600 to-green-500 transition-all duration-300"
            style={{ width: `${succeededPercent}%` }}
          />

          {/* Red from right */}
          <div
            className="absolute top-0 right-0 h-full bg-gradient-to-l from-red-600 to-red-500 transition-all duration-300"
            style={{ width: `${failedPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}