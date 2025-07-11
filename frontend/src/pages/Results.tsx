/*
 * PURPOSE: Results page to display swing analysis feedback
 * 
 * This component retrieves the analysis data sent from the Home page and
 * displays a detailed breakdown of the golf swing, including:
 * - Analysis summary
 * - Recommended drills
 * - Key frames from the video
 * 
 * It also features navigation back to the Home page for further analysis.
 */

// Import necessary libraries and components
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import AnalysisResults from '../components/AnalysisResults';

// Define the structure of the analysis data
interface AnalysisData {
  summary: string;      // Text summary of the swing
  drills: Array<{
    title: string;       // Drill name
    description: string; // Drill description
  }>;
  keyframes: string[];  // URLs to key moments images
}

// Define the Results component
const Results: React.FC = () => {
  // Retrieve the analysis data passed through navigation
  const location = useLocation();
  const analysisData = location.state as AnalysisData;

  // If no data is available, show error message
  if (!analysisData) {
    return (
      // Background styling and layout
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">No Analysis Data</h1>
            <p className="text-gray-600 mb-6">
              It looks like you've reached this page without uploading a video. 
              Please go back to the home page to analyze your golf swing.
            </p>
            {/* Button to navigate back to the upload page */}
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Upload Video
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Return the main analysis results display
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Your Golf Swing Feedback
          </h1>
          <p className="text-lg text-gray-600">
            Here's your personalized analysis and training recommendations
          </p>
        </div>

        {/* Render the analysis results component with the passed data */}
        <AnalysisResults
          summary={analysisData.summary}
          drills={analysisData.drills}
          keyframes={analysisData.keyframes}
        />

        {/* Navigation button to analyze another video */}
        <div className="mt-12 text-center">
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Analyze Another Swing
          </Link>
        </div>
      </div>
    </div>
  );
};

// Export the Results component
export default Results;
