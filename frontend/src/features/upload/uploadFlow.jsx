import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import UploadFileScreen from "./screens/uploadFileScreen";
import TrimVideoScreen from "./screens/trimVideoScreen";
import { AnalyzingScreen } from "./screens/AnalysingScreen";
import useUploadFlow from "../upload/hooks/useUploadFlow";
import { useFileHandling } from "./hooks/useFileHandling";
import { usePromptConfig } from "./hooks/usePromptConfig";
import { useUploadAndAnalyze } from "./hooks/useUploadAndAnalyze";

export default function UploadFlow() {
  const location = useLocation();
  const navigate = useNavigate();
  const { step, goToUpload, goToTrim, goToAnalyzing } = useUploadFlow();
  const fileHandling = useFileHandling({ allowedTypes: ['video/'] });
  const promptConfig = usePromptConfig();
  const [errorMessage, setErrorMessage] = useState("");

  // Additional state for trim times
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);

  // Upload and analysis state - lifted to orchestrator level
  const uploadFlow = useUploadAndAnalyze(
    // onComplete - redirect to analysis page
    (analysisId) => {
      navigate(`/dashboard/analyse?analysisId=${analysisId}`);
    },
    // onError - handled via uploadFlow.error state, no callback needed
    null
  );

  // Auto-transition to analyzing screen when upload starts (analysisId is set)
  useEffect(() => {
    if (uploadFlow.analysisId && step !== 'analyzing') {
      goToAnalyzing();
    }
  }, [uploadFlow.analysisId, step, goToAnalyzing]);

  // Handle file selection
  const handleFileSelected = () => {
    if (fileHandling.file) {
      goToTrim();
    }
  };

  // Handle file removal - reset everything
  const handleRemoveFile = () => {
    fileHandling.removeFile();
    promptConfig.resetConfig();
    setStartTime(0);
    setEndTime(0);
    uploadFlow.reset();
    setErrorMessage("");
    goToUpload();
  };

  // Handle upload request from TrimVideoScreen
  const handleUpload = useCallback(async () => {
    if (!fileHandling.file) {
      console.error("No file to upload");
      return;
    }

    setErrorMessage('');

    try {
      await uploadFlow.startUpload(
        fileHandling.file,
        promptConfig.advancedInput,
        startTime,
        endTime,
        promptConfig.AImodel
      );
    } catch (err) {
      const errorMsg = err.message || 'Upload failed';
      setErrorMessage(errorMsg);
    }
  }, [fileHandling.file, promptConfig, startTime, endTime, uploadFlow]);

  // Handle error dismissal from AnalyzingScreen - go back to trim
  const handleErrorDismiss = useCallback(() => {
    uploadFlow.reset();
    setErrorMessage("");
    goToTrim();
  }, [uploadFlow, goToTrim]);

  switch (step) {
    case "upload":
      return (
        <UploadFileScreen
          fileHandling={fileHandling}
          errorMessage={errorMessage}
          setErrorMessage={setErrorMessage}
          onFileSelected={handleFileSelected}
        />
      );

    case "trim":
      return (
        <TrimVideoScreen
          fileHandling={fileHandling}
          promptConfig={promptConfig}
          startTime={startTime}
          endTime={endTime}
          setStartTime={setStartTime}
          setEndTime={setEndTime}
          onRemoveFile={handleRemoveFile}
          onUpload={handleUpload}
          isUploading={uploadFlow.isUploading}
          errorMessage={errorMessage || uploadFlow.error}
          onErrorDismiss={() => {
            uploadFlow.reset();
            setErrorMessage("");
          }}
        />
      );

    case "analyzing":
      return (
        <AnalyzingScreen
          analysisId={uploadFlow.analysisId}
          analysisStatus={uploadFlow.analysisStatus}
          error={uploadFlow.error}
          isComplete={uploadFlow.isComplete}
          onErrorDismiss={handleErrorDismiss}
        />
      );

    default:
      return null;
  }
}
