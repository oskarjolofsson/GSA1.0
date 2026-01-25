import { useState } from "react";
import UploadFileScreen from "./screens/uploadFileScreen";
import TrimVideoScreen from "./screens/trimVideoScreen";
import { AnalyzingScreen } from "./screens/AnalysingScreen";
import useUploadFlow from "../upload/hooks/useUploadFlow";
import { useFileHandling } from "./hooks/useFileHandling";
import { usePromptConfig } from "./hooks/usePromptConfig";

export default function UploadFlow() {
  const { step, goToUpload, goToTrim, goToAnalyzing } = useUploadFlow();
  const fileHandling = useFileHandling({ allowedTypes: ['video/'] });
  const promptConfig = usePromptConfig();
  const [errorMessage, setErrorMessage] = useState("");
  const [analysisId, setAnalysisId] = useState(null);

  // Additional state for trim times
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);

  const handleFileSelected = () => {
    if (fileHandling.file) {
      goToTrim();
    }
  };

  const handleRemoveFile = () => {
    fileHandling.removeFile();
    promptConfig.resetConfig();
    setStartTime(0);
    setEndTime(0);
    goToUpload();
  };

  const handleAnalyzing = (id) => {
    setAnalysisId(id);
    goToAnalyzing();
  };

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
          onAnalyzing={handleAnalyzing}
        />
      );

    case "analyzing":
      return (
        <AnalyzingScreen
          file={fileHandling.file}
          promptConfig={promptConfig}
          analysisId={analysisId}
        />
      );

    default:
      return null;
  }
}
