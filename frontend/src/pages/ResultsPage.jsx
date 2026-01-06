import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Share2 } from "lucide-react";
import ResultBox from "../components/fileUpload/result-box.jsx";
import SharePopup from "../components/popup/SharePopup.jsx";
import pastDrillService from "../services/pastDrillService.js";
import Loading1 from "../components/loading/loading1.jsx";
import TextBox from "../components/textBox/textBox.jsx";
import tokenService from "../services/tokenService.js";
import SignInPopup from "../components/signInPopup/signInPopup.jsx";
import { useAuth } from "../auth/authContext.jsx";
import FeedbackBubble from "../components/popup/FeedbackBubble.jsx";
import FeedbackPopup from "../components/popup/FeedbackPopup.jsx";

const API = import.meta.env.VITE_API_URL;

export default function ResultsPage() {
  const { analysisId } = useParams();
  const [searchParams] = useSearchParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [cta, setCta] = useState({
    text: null,
    onClick: null,
  });
  const [showSignInPopup, setShowSignInPopup] = useState(false);
  const { user, login } = useAuth();
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);

  const share_user_id = searchParams.get("share_user_id");

  // Fetch user_id from firebase
  const user_id = tokenService.getUserId();; // TODO: get user id from auth context or similar
  useEffect(() => {
    if (!user) {
      setCta({
        text: "Log in to view this analysis",
        onClick: () => {
          setShowSignInPopup(true);
        }
      });
      setError("You must be logged in to view this analysis.");
    }
  }, [user]);


  const share_button_url = window.location.origin + "/results/" + analysisId + "?share_user_id=" + user_id;

  useEffect(() => {
    const fetchAnalysis = async () => {
      // Don't fetch if user is not logged in and there's no share_user_id
      if (!user && !share_user_id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
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
  }, [analysisId, user, share_user_id]);

  if (loading) {
    return <Loading1 />;
  }

  return (
    <div className="text-slate-100 relative overflow-hidden py-12 min-h-screen">
      <section className="relative mx-auto max-w-6xl px-4 mt-16">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-center">Analysis Results</h1>

        {analysis ? (
          <>
            {/* Only show share button if there is no share_user_id in URL or share_user_id is not the same as the current user */}
            {(share_user_id === user_id || !share_user_id) && (
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => setShowSharePopup(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  <Share2 size={20} />
                  Share
                </button>
              </div>
            )}
            <ResultBox analysis={analysis} />
          </>
        ) : null}
        {!analysis && error && (

          <TextBox header={"Analysis Not Found 😩"} text={error} ctaText={cta.text} ctaOnClick={cta.onClick} />
        )}
        {showSharePopup && (
          <SharePopup
            shareUrl={share_button_url}
            onClose={() => setShowSharePopup(false)}
          />
        )}
        {showSignInPopup && (
          <SignInPopup
            onClose={() => setShowSignInPopup(false)}
            onStartSignIn={login}
          />
        )}

        <FeedbackBubble onOpenFeedback={() => setShowFeedbackPopup(true)} />
        <FeedbackPopup isOpen={showFeedbackPopup} onClose={() => setShowFeedbackPopup(false)} />
      </section>
    </div>
  );
}
