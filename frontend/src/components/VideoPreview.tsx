import React from 'react';
import ReactPlayer from 'react-player';

interface VideoPreviewProps {
  file: File;
  onConfirm: () => void;
  onRemove: () => void;
  isAnalyzing: boolean;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ file, onConfirm, onRemove, isAnalyzing }) => {
  const videoUrl = URL.createObjectURL(file);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Preview Your Video</h3>
        
        <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
          <ReactPlayer
            url={videoUrl}
            width="100%"
            height="100%"
            controls
            playing={false}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="text-sm text-gray-600">
            <p className="font-medium">{file.name}</p>
            <p>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onRemove}
              disabled={isAnalyzing}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Remove
            </button>
            <button
              onClick={onConfirm}
              disabled={isAnalyzing}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze My Swing'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPreview;
