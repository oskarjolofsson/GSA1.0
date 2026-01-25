import { useState } from "react";

export function useUploadFlow() {
  const [step, setStep] = useState("upload");

  return {
    step,
    goToUpload: () => setStep("upload"),
    goToTrim: () => setStep("trim"),
    goToAnalyzing: () => setStep("analyzing"),
  };
}
