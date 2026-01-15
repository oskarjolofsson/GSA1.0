import { useState, useEffect } from "react";
import { useAuth } from "../auth/authContext";

export default function Drills() {
  const { user } = useAuth();
  const [drills, setDrills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // useEffect(() => {
  //   const fetchUserDrills = async () => {
  //     try {
  //       setLoading(true);
  //       setError(null);
        
  //       if (!user) {
  //         setDrills([]);
  //         setLoading(false);
  //         return;
  //       }

  //       // Get ID token for authentication
  //       const idToken = await user.getIdToken();
        
  //       const response = await fetch(
  //         `${import.meta.env.VITE_API_URL}/user/drills`,
  //         {
  //           headers: {
  //             "Authorization": `Bearer ${idToken}`,
  //             "Content-Type": "application/json",
  //           },
  //         }
  //       );

  //       if (!response.ok) {
  //         throw new Error(`Failed to fetch drills: ${response.statusText}`);
  //       }

  //       const data = await response.json();
  //       setDrills(data.drills || []);
  //     } catch (err) {
  //       console.error("Error fetching drills:", err);
  //       setError(err.message);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchUserDrills();
  // }, [user]);



  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <p className="mt-4 text-slate-300">Loading your drills...</p>
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

  if (!drills || drills.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
          <h2 className="text-2xl font-semibold text-slate-100 mb-2">No Drills Yet</h2>
          <p className="text-slate-400 mb-6">Start by uploading a swing to create your first drill</p>
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

  // Get most recent drill
  const mostRecent = drills[0];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Most Recent Drill */}
      {mostRecent && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-slate-100 mb-4">Most Recent Drill</h2>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition">
            <div className="flex flex-col md:flex-row gap-6">
              {mostRecent.thumbnailUrl && (
                <div className="md:w-1/3">
                  <img
                    src={mostRecent.thumbnailUrl}
                    alt={mostRecent.name || "Drill"}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-100 mb-2">
                  {mostRecent.name || "Unnamed Drill"}
                </h3>
                {mostRecent.date && (
                  <p className="text-sm text-slate-400 mb-3">
                    {new Date(mostRecent.date).toLocaleDateString()}
                  </p>
                )}
                {mostRecent.analysis && (
                  <div className="bg-slate-900/50 rounded p-3 mb-4">
                    <p className="text-sm text-slate-300">
                      {typeof mostRecent.analysis === 'string'
                        ? mostRecent.analysis
                        : mostRecent.analysis.summary || "Analysis available"}
                    </p>
                  </div>
                )}
                <a
                  href={`/results/${mostRecent.id}`}
                  className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm"
                >
                  View Analysis
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* All Drills */}
      <section>
        <h2 className="text-2xl font-semibold text-slate-100 mb-4">All Drills</h2>
        <div className="grid gap-4">
          {drills.map((drill) => (
            <div
              key={drill.id}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-slate-100 truncate">
                    {drill.name || "Unnamed Drill"}
                  </h3>
                  {drill.date && (
                    <p className="text-sm text-slate-400">
                      {new Date(drill.date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <a
                  href={`/results/${drill.id}`}
                  className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm whitespace-nowrap"
                >
                  View
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}