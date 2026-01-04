import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ResultBox from "../components/fileUpload/result-box.jsx";
import ErrorPopup from "../components/popup/ErrorPopup.jsx";
import Loading from "../components/fileUpload/loading.jsx";
import pastDrillService from "../services/pastDrillService.js";

const API = import.meta.env.VITE_API_URL;

export default function ResultsPage() {
  const { analysisId } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await pastDrillService.getAnalysisById(analysisId);
        setAnalysis(data);
      } catch (err) {
        console.error("Error fetching analysis:", err);
        setError("An error occurred while loading the analysis. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (analysisId) {
      fetchAnalysis();
    }
  }, [analysisId]);

  if (loading) {
    return <Loading time={40} full={true} />;
  }

  return (
    <div className="text-slate-100 relative overflow-hidden py-12 min-h-screen">
      <section className="relative mx-auto max-w-6xl px-4 mt-16">
        {analysis ? (
          <ResultBox analysis={analysis} />
        ) : null}

        <ErrorPopup
          message={error}
          onClose={() => setError("")}
        />
      </section>
    </div>
  );
}
