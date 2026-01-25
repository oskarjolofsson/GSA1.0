import { UploadFileScreen } from "../upload/screens/uploadFileScreen";
import { TrimVideoScreen } from "../upload/screens/trimVideoScreen";
import { AnalyzingScreen } from "../upload/screens/analyzingScreen";
import { useUploadFlow } from "../upload/hooks/useUploadFlow";

export function UploadFlow() {
  const { step } = useUploadFlow();

  switch (step) {
    case "upload":
      return <UploadFileScreen />;

    case "trim":
      return <TrimVideoScreen />;

    case "analyzing":
      return <AnalyzingScreen />;

    default:
      return null;
  }
}
