import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Share2 } from "lucide-react";
import ResultBox from "../components/fileUpload/result-box.jsx";
import SharePopup from "../components/popup/SharePopup.jsx";
import pastDrillService from "../services/pastDrillService.js";
import Loading1 from "../components/loading/loading1.jsx";
import TextBox from "../components/textBox/textBox.jsx";

const API = import.meta.env.VITE_API_URL;

export default function ResultsPage() {
  const { analysisId } = useParams();
  const [searchParams] = useSearchParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSharePopup, setShowSharePopup] = useState(false);
  
  const share_user_id = searchParams.get("share_user_id");

  useEffect(() => {

    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        setError("");
        console.log("Fetching analysis with ID:", analysisId, "and share_user_id:", share_user_id);
        const data = await pastDrillService.getAnalysisById(analysisId, share_user_id);
        setAnalysis(data);
      } catch (err) {
        console.error("Error fetching analysis:", err);
        setError("An error occurred while loading the analysis");
      } finally {
        setLoading(false);
      }
    };

    if (analysisId) {
      fetchAnalysis();
    }
  }, [analysisId]);

  if (loading) {
    return <Loading1 />;
  }

  return (
    <div className="text-slate-100 relative overflow-hidden py-12 min-h-screen">
      <section className="relative mx-auto max-w-6xl px-4 mt-16">
        {analysis ? (
          <>
            <div className="flex justify-end mb-6">
              <button
                onClick={() => setShowSharePopup(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                <Share2 size={20} />
                Share
              </button>
            </div>
            <ResultBox analysis={analysis} />
          </>
        ) : null}

        <TextBox header={"Analysis Not Found 😩"} text={error} />
        {showSharePopup && (
        <SharePopup
          shareUrl={`${window.location.origin}/results/${analysisId}${share_user_id ? `?share_user_id=${share_user_id}` : ""}`}
          onClose={() => setShowSharePopup(false)}
        />
        )}
      </section>
    </div>
  );
}
