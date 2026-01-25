import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useValidationState } from "../../hooks/useValidationState.js";
import { useSubscriptionAndTokens } from "../../hooks/useSubscriptionAndTokens.js";
import { useVideoUpload } from "../../hooks/useVideoUpload.js";
import { useFileHandling } from "../../features/upload/hooks/useFileHandling.js";
import { usePromptConfig } from "../../features/upload/hooks/usePromptConfig.js";
import { ValidationProvider } from "../../context/ValidationContext.jsx";
import tokenService from "../../services/tokenService.js";
import Loading1 from "../loading/loading1.jsx";

// Component imports
import DropZone from "./DropZone.jsx";
import PreviewPane from "./preview/PreviewPane.jsx";
import ErrorPopup from "../popup/ErrorPopup.jsx";
import OutOfTokensPopup from "../popup/OutOfTokensPopup.jsx";
import UploadButtonZone from "./UploadButtonZone.jsx";
import Loading from "./loading.jsx";

// [Keep all other imports and component functions the same]

export default function UploadPage({ initialFile }) {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [showOutOfTokensPopup, setShowOutOfTokensPopup] = useState(false);

  // Validation state
  const validationState = useValidationState();

  // Prompt configuration
  const { advancedInput, setAdvancedInput, AImodel, setAImodel, resetConfig } = usePromptConfig();

  // Subscription and tokens
  const { tokenCount, hasSubscription, setTokenCount } = useSubscriptionAndTokens();

  // File handling with error throwing
  const { file, previewUrl, isLoading, handleFileSelection, handleDrop, removeFile, setFile } =
    useFileHandling({ allowedTypes: ['video/'] });

  // Video upload
  const { analysis, analysisId, uploading: isUploading, errorMessage, uploadVideo, setAnalysis, setErrorMessage } =
    useVideoUpload();

  function onTime(start, end) {
    setStartTime(start);
    setEndTime(end);
  }

  useEffect(() => {
    // If initialFile is provided, set it directly
    if (initialFile && !file) {
      setFile(initialFile);
    }
  }, [initialFile, file, setFile]);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 30);
    return () => clearTimeout(t);
  }, []);

  // Redirect to results page after successful upload
  useEffect(() => {
    if (analysis && analysisId && !isUploading) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        navigate(`/results/${analysisId}`);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [analysis, analysisId, isUploading, navigate]);

  function onSelect(files) {
    try {
      handleFileSelection(files);
    } catch (err) {
      setErrorMessage(err.message);
      removeFile(); // Clear any partial state
    }
  }

  function onDropHandler(e) {
    setDragActive(false);
    try {
      handleDrop(e);
    } catch (err) {
      setErrorMessage(err.message);
    }
  }

  function onRemove() {
    if (isUploading) return;
    resetConfig();
    removeFile();
    if (inputRef.current) inputRef.current.value = "";
  }

  async function onUpload() {
    if (!file) return;
    if (isUploading) return;

    // Check for tokens and subscription is currently removed
    // if (!hasSubscription && tokenCount === 0) {
    //   setShowOutOfTokensPopup(true);
    //   return;
    // }

    try {
      await uploadVideo(file, advancedInput, startTime, endTime, tokenCount, hasSubscription, AImodel);

      // Update token count after successful upload
      // try {
      //   const updatedCount = await tokenService.getBalance();
      //   setTokenCount(updatedCount);
      // } catch (e) {
      //   console.error('Error updating token balance:', e);
      // }
    } catch (err) {
      // if (err.message === 'OUT_OF_TOKENS') {
      //   setShowOutOfTokensPopup(true);
      // } else {
      //   setErrorMessage(err.message || "Upload failed");
      // }
      setErrorMessage(err.message || "Upload failed");
    }
  }

  return (
    <ValidationProvider validationState={validationState}>
      <div className="h-auto text-slate-100 relative overflow-hidden py-12 min-h-screen">
        <section className="relative mx-auto max-w-6xl px-4 mt-16">
          {isLoading || isUploading ? (
            <Loading time={40} full={true} />
          ) : !analysis ? (
            <>
              { !file && <UploadHeader /> }

              <div className="gap-12">
                
                {!file ? (
                  <DropZone
                    file={file}
                    dragActive={dragActive}
                    setDragActive={setDragActive}
                    ready={ready}
                    inputRef={inputRef}
                    onDrop={onDropHandler}
                    onSelect={onSelect}
                    onUpload={onUpload}
                    uploading={isUploading}
                  />
                ) : (
                  <>
                    <PreviewPane
                      previewUrl={previewUrl}
                      ready={ready}
                      uploading={isUploading}
                      onRemove={onRemove}
                      onTime={onTime}
                      advancedInput={advancedInput}
                      setAdvancedInput={setAdvancedInput}
                      selectedAI={AImodel}
                      setAI={setAImodel}
                    />
                    <UploadButtonZone
                      onUpload={onUpload}
                      uploading={isUploading}
                      tokenCount={hasSubscription ? "∞" : tokenCount}
                      file={file}
                    />
                  </>
                )}
              </div>
            </>
          ) : (
            // Loading state while redirecting
            <Loading1 />
          )}

          <ErrorPopup message={errorMessage} onClose={() => setErrorMessage("")} />
          <OutOfTokensPopup isOpen={showOutOfTokensPopup} onClose={() => setShowOutOfTokensPopup(false)} />
        </section>
      </div>
    </ValidationProvider>
  );
}

function UploadHeader() {
  return (
    <header className="mb-12 text-center">
      <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">Upload & Get Feedback</h1>
      <p className="mt-4 text-slate-400">Drop a single video below. We'll analyze it and return insights.</p>
    </header>
  );
}

