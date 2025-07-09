import React from 'react';

interface Drill {
  title: string;
  description: string;
}

interface AnalysisResultsProps {
  summary: string;
  drills: Drill[];
  keyframes: string[];
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ summary, drills, keyframes }) => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Summary Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Swing Analysis</h2>
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed">{summary}</p>
        </div>
      </div>

      {/* Drills Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recommended Drills</h2>
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          {drills.map((drill, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{drill.title}</h3>
              <p className="text-gray-600">{drill.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Frames Section */}
      {keyframes.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Moments</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {keyframes.map((frame, index) => (
              <div key={index} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={frame}
                  alt={`Key frame ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisResults;
