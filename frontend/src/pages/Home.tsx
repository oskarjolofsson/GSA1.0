import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoUpload from '../components/VideoUpload';
import VideoPreview from '../components/VideoPreview';
import LoadingOverlay from '../components/LoadingOverlay';
import { analyzeSwing } from '../utils/api';

const Home: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();

  const handleVideoSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleRemoveVideo = () => {
    setSelectedFile(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    try {
      const results = await analyzeSwing(selectedFile);
      // Navigate to results page with the analysis data
      navigate('/results', { state: results });
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
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

        {/* Tips Section */}
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

export default Home;
