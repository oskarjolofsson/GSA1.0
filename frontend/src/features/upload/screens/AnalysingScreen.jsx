import { AnalysisProgress } from "../components/AnalysisProgress";

export function AnalyzingScreen({ estimatedTimeSeconds = 30 }) {
  return (
    <div className="flex justify-center mt-6 px-4">
      <div className="w-full max-w-md bg-gray-900 p-4 rounded-xl shadow-lg border border-gray-700">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold text-white">
            Analyzing Your Swing
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            Please wait while we process your video...
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
  );
}
