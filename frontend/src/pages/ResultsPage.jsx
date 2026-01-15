import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Share2 } from "lucide-react";
import ResultBox from "../components/result/result-box.jsx";
import SharePopup from "../components/popup/SharePopup.jsx";
import pastDrillService from "../services/pastDrillService.js";
import Loading1 from "../components/loading/loading1.jsx";
import TextBox from "../components/textBox/textBox.jsx";
import tokenService from "../services/tokenService.js";
import SignInPopup from "../components/signInPopup/signInPopup.jsx";
import { useAuth } from "../auth/authContext.jsx";
import FeedbackBubble from "../components/popup/FeedbackBubble.jsx";
import FeedbackPopup from "../components/popup/FeedbackPopup.jsx";

export default function ResultsPage() {
  const { analysisId } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [videoURL, setVideoURL] = useState(null);
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
  const [drillImageURL, setDrillImageURL] = useState(null);
  const [drillImageLoading, setDrillImageLoading] = useState(false);
  const [drillImageTimeout, setDrillImageTimeout] = useState(false);
  const [activeProblem, setActiveProblem] = useState(0);

  const share_button_url = window.location.origin + "/results/" + analysisId;

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const data = await pastDrillService.getAnalysisById(analysisId);
        setAnalysis(data.analysis.analysis_results);
        setVideoURL(data.video_url);
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
  }, [analysisId, user]);

  useEffect(() => {
    const fetchDrillImage = async () => {
      if (!analysis || !analysis.key_findings || analysis.key_findings.length === 0) {
        setDrillImageURL(null);
        setDrillImageLoading(false);
        setDrillImageTimeout(false);
        return;
      }

      const activeFinding = analysis.key_findings[activeProblem];
      if (!activeFinding || !activeFinding.drill_id) {
        setDrillImageURL(null);
        setDrillImageLoading(false);
        setDrillImageTimeout(false);
        return;
      }

      try {
        setDrillImageLoading(true);
        setDrillImageTimeout(false);
        
        // Set timeout for 60 seconds
        const timeoutId = setTimeout(() => {
          setDrillImageTimeout(true);
        }, 60000);
        
        const imageUrl = await pastDrillService.getDrillImageURL(activeFinding.drill_id);
        clearTimeout(timeoutId);
        setDrillImageURL(imageUrl);
        setDrillImageTimeout(false);
      } catch (err) {
        console.error("Error fetching drill image:", err);
        setDrillImageURL(null);
      } finally {
        setDrillImageLoading(false);
      }
    };

    fetchDrillImage();
  }, [analysis, activeProblem]);

  if (loading) {
    return <Loading1 />;
  }

  return (
    <div className="text-slate-100 relative overflow-hidden py-12 min-h-screen">
      <section className="relative mx-auto max-w-6xl px-4 mt-16">
        {/* <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-center">Analysis Results</h1> */}

        {analysis ? (
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
            <ResultBox analysis={analysis} video_url={videoURL} drill_image_url={drillImageURL} drill_image_loading={drillImageLoading} drill_image_timeout={drillImageTimeout} activeProblem={activeProblem} setActiveProblem={setActiveProblem} />
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
