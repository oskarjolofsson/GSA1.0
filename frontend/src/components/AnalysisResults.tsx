/*
 * PURPOSE: AnalysisResults component for displaying golf swing analysis
 * 
 * This component displays the results of a golf swing analysis in three sections:
 * 1. Summary - Overall analysis text with feedback about the swing
 * 2. Drills - Recommended practice drills to improve the swing
 * 3. Key Frames - Important moments from the swing video (if available)
 * 
 * The component uses a responsive grid layout and handles missing data gracefully.
 */

// Import React library
import React from 'react';

// Define the structure of a drill object
interface Drill {
  title: string;       // Name of the drill
  description: string; // Instructions for the drill
}

// Define the props that this component expects
interface AnalysisResultsProps {
  summary: string;     // Text summary of the swing analysis
  drills: Drill[];     // Array of recommended drills
  keyframes: string[]; // Array of image URLs from key moments in the swing
}

// Define the AnalysisResults component
const AnalysisResults: React.FC<AnalysisResultsProps> = ({ summary, drills, keyframes }) => {
  return (
    // Main container with max width and centered
    <div className="max-w-4xl mx-auto">
      
      {/* Summary Section - Shows the analysis text */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Swing Analysis</h2>
        <div className="prose prose-gray max-w-none">
          {/* Display the analysis summary text */}
          <p className="text-gray-700 leading-relaxed">{summary}</p>
        </div>
      </div>

      {/* Drills Section - Shows recommended practice drills */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recommended Drills</h2>
        {/* Responsive grid: 1 column on mobile, 2 columns on large screens */}
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          {/* Loop through each drill and display it */}
          {drills.map((drill, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              {/* Drill title */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{drill.title}</h3>
              {/* Drill description/instructions */}
              <p className="text-gray-600">{drill.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Frames Section - Shows important moments from the swing */}
      {/* Only render this section if there are keyframes to display */}
      {keyframes.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Moments</h2>
          {/* Responsive grid: 2 columns on medium screens, 3 on large */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Loop through each keyframe image */}
            {keyframes.map((frame, index) => (
              <div key={index} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {/* Handle image loading errors by hiding the image */}
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

// Export the AnalysisResults component
export default AnalysisResults;
