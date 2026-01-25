// import UploadFileScreen from "./screens/uploadFileScreen";
// import TrimVideoScreen from "./screens/trimFileScreen";
import { AnalyzingScreen } from "./screens/AnalysingScreen";
import useUploadFlow from "../upload/hooks/useUploadFlow";

export default function UploadFlow() {
  const { step } = useUploadFlow();

  // switch (step) {
  //   case "upload":
  //     return <UploadFileScreen />;

  //   case "trim":
  //     return <TrimVideoScreen />;

  //   case "analyzing":
  //     return <AnalyzingScreen />;

  //   default:
  //     return null;
  // }

  return <AnalyzingScreen />;
}
