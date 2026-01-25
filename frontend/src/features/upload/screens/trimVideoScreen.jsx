import { useState, useEffect } from "react";
import { useValidationState } from "../../../hooks/useValidationState.js";
import { useVideoUpload } from "../../../hooks/useVideoUpload.js";
import { ValidationProvider } from "../../../context/ValidationContext.jsx";
import PreviewPane from "../../../components/fileUpload/preview/PreviewPane.jsx";
import UploadButtonZone from "../../../components/fileUpload/UploadButtonZone.jsx";
import ErrorPopup from "../../../components/popup/ErrorPopup.jsx";

export default function TrimVideoScreen({
  fileHandling,
  promptConfig,
  startTime,
  endTime,
  setStartTime,
  setEndTime,
  onRemoveFile,
  onAnalyzing,
}) {
  const [ready, setReady] = useState(false);

  // Validation state
  const validationState = useValidationState();

  // Video upload
  const { analysis, analysisId, uploading: isUploading, errorMessage, uploadVideo, setErrorMessage } =
    useVideoUpload();

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 30);
    return () => clearTimeout(timer);
  }, []);

  // Navigate to analyzing screen when upload completes
  useEffect(() => {
    if (analysis && analysisId && !isUploading) {
      onAnalyzing(analysisId);
    }
  }, [analysis, analysisId, isUploading, onAnalyzing]);

  function handleTime(start, end) {
    setStartTime(start);
    setEndTime(end);
  }

  async function handleUpload() {
    if (!fileHandling.file) return;
    if (isUploading) return;

    try {
      await uploadVideo(
        fileHandling.file,
        promptConfig.advancedInput,
        startTime,
        endTime,
        promptConfig.AImodel
      );
    } catch (err) {
      setErrorMessage(err.message || "Upload failed");
    }
  }

  return (
    <ValidationProvider validationState={validationState}>
      <div className="h-auto text-slate-100 relative overflow-hidden min-h-screen">
        <section className="relative mx-auto max-w-6xl px-4 mt-5">
          <div className="gap-12">
            <PreviewPane
              previewUrl={fileHandling.previewUrl}
              ready={ready}
              uploading={isUploading}
              onRemove={onRemoveFile}
              onTime={handleTime}
              advancedInput={promptConfig.advancedInput}
              setAdvancedInput={promptConfig.setAdvancedInput}
              selectedAI={promptConfig.AImodel}
              setAI={promptConfig.setAImodel}
            />
            <UploadButtonZone
              onUpload={handleUpload}
              uploading={isUploading}
              file={fileHandling.file}
            />
          </div>

          <ErrorPopup message={errorMessage} onClose={() => setErrorMessage("")} />
        </section>
      </div>
    </ValidationProvider>
  );
}
