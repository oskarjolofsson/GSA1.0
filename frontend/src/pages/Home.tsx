/*
 * PURPOSE: Home page component for the Golf Swing Analyzer
 * 
 * This component provides the main functionality for the app:
 * 1. Users can upload a golf swing video
 * 2. It handles video upload, removal, and analysis
 * 3. Displays a loading overlay during analysis
 * 4. Shows tips for better video analysis
 * 5. Manages routes to the Results page upon analysis completion
 */

// Import React and necessary hooks
import React, { useState } from 'react';
// Import navigation hook to move between pages
import { useNavigate } from 'react-router-dom';
// Import custom components for uploading and previewing videos
import VideoUpload from '../components/VideoUpload';
import VideoPreview from '../components/VideoPreview';
// Import the loading overlay component
import LoadingOverlay from '../components/LoadingOverlay';
// Import the API call function to analyze the swing
import { analyzeSwing } from '../utils/api';

// Home page functional component
const Home: React.FC = () => {
  // State to keep track of the selected video file
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // State to determine if the app is currently analyzing the video
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // Hook to navigate to different routes (pages)
  const navigate = useNavigate();

  // Function to handle video selection
  const handleVideoSelect = (file: File) => {
    setSelectedFile(file);
  };

  // Function to remove the selected video
  const handleRemoveVideo = () => {
    setSelectedFile(null);
  };

  // Function to initiate video analysis when user clicks "Analyze"
  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    try {
      // Call the API to analyze the golf swing video
      const results = await analyzeSwing(selectedFile);
      // On successful analysis, navigate to the Results page with data
      navigate('/results', { state: results });
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Render the component
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      {/* Show loading overlay when analysis is in progress */}
      <LoadingOverlay isVisible={isAnalyzing} />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Upload Your Golf Swing
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload a video of your golf swing and get AI-powered analysis with personalized 
            feedback and training recommendations.
          </p>
        </div>

        <div className="space-y-8">
          {/* Conditionally render based on whether a file is selected */}
          {!selectedFile ? (
            <VideoUpload 
              onVideoSelect={handleVideoSelect} 
              selectedFile={selectedFile} 
            />
          ) : (
            <VideoPreview
              file={selectedFile}
              onConfirm={handleAnalyze}
              onRemove={handleRemoveVideo}
              isAnalyzing={isAnalyzing}
            />
          )}
        </div>

        {/* Tips Section for users to get better analysis */}
        <div className="mt-16 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Tips for Better Analysis</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Video Quality</h3>
              <ul className="space-y-1">
                <li>• Record in landscape orientation</li>
                <li>• Ensure good lighting</li>
                <li>• Keep camera steady</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Camera Position</h3>
              <ul className="space-y-1">
                <li>• Film from the side (down-the-line view)</li>
                <li>• Include full body in frame</li>
                <li>• Capture the entire swing motion</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export the Home component for use in other parts of the app
export default Home;
