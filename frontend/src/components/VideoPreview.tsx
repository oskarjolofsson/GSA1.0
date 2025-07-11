/*
 * PURPOSE: VideoPreview component for displaying and controlling uploaded video
 * 
 * This component provides:
 * 1. A video player showing the uploaded golf swing video
 * 2. File information display (name, size)
 * 3. Action buttons to remove video or start analysis
 * 4. Disabled state during analysis process
 */

// Import React library
import React from 'react';
// Import ReactPlayer component for video playback
import ReactPlayer from 'react-player';

// Define the types for the component props
interface VideoPreviewProps {
  file: File;                    // The uploaded video file
  onConfirm: () => void;         // Function to call when user confirms analysis
  onRemove: () => void;          // Function to call when user removes the video
  isAnalyzing: boolean;          // Whether analysis is currently in progress
}

// Define the VideoPreview component
const VideoPreview: React.FC<VideoPreviewProps> = ({ file, onConfirm, onRemove, isAnalyzing }) => {
  // Create a URL for the video file so ReactPlayer can display it
  const videoUrl = URL.createObjectURL(file);

  // Render the component
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Preview Your Video</h3>
        
        {/* Video player container */}
        <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
          <ReactPlayer
            url={videoUrl}
            width="100%"
            height="100%"
            controls                // Show video controls (play, pause, etc.)
            playing={false}         // Don't auto-play the video
          />
        </div>
        
        {/* File info and action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* File information */}
          <div className="text-sm text-gray-600">
            <p className="font-medium">{file.name}</p>
            <p>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-3">
            {/* Remove button */}
            <button
              onClick={onRemove}
              disabled={isAnalyzing}  // Disable during analysis
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Remove
            </button>
            {/* Analyze button */}
            <button
              onClick={onConfirm}
              disabled={isAnalyzing}  // Disable during analysis
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Change button text based on analysis state */}
              {isAnalyzing ? 'Analyzing...' : 'Analyze My Swing'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export the VideoPreview component
export default VideoPreview;
