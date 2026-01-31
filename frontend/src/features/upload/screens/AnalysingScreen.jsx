import { AnalysisProgress } from "../components/AnalysisProgress";
import ErrorPopup from "../../../shared/components/popup/ErrorPopup.jsx";

export function AnalyzingScreen({ 
  analysisId,
  analysisStatus = null, 
  error = null,
  isComplete = false,
  onErrorDismiss,
  estimatedTimeSeconds = 30,
}) {
  const getStatusMessage = () => {
    if (isComplete) {
      return "Analysis complete! Redirecting...";
    }
    
    if (error) {
      return "Analysis encountered an error";
    }
    
    if (!analysisStatus) {
      return "Uploading your video...";
    }
    
    switch (analysisStatus.status) {
      case 'processing':
      case 'analyzing':
        return "Analyzing your swing...";
      case 'completed':
        return "Analysis complete! Redirecting...";
      case 'failed':
      case 'error':
        return "Analysis encountered an error";
      default:
        return "Processing your swing...";
    }
  };

  return (
    <div className="h-auto text-slate-100 relative overflow-hidden min-h-screen flex items-center justify-center py-10">
      <div className="flex justify-center mt-6 px-4 h-full items-center">
        <div className="w-full max-w-md bg-gray-900 p-4 rounded-xl shadow-lg border border-gray-700">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-white">
              Analyzing Your Swing
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              {getStatusMessage()}
            </p>
          </div>

          {/* Progress */}
          <AnalysisProgress durationSeconds={estimatedTimeSeconds} />

          {/* Footer */}
          <p className="text-center text-gray-500 text-xs mt-4">
            This may take up to {estimatedTimeSeconds} seconds depending on the
            length of your video and server load.
          </p>
        </div>
      </div>

      {/* Error popup - dismissing goes back to trim screen */}
      <ErrorPopup 
        message={error} 
        onClose={onErrorDismiss} 
      />
    </div>
  );
}
