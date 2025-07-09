import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface VideoUploadProps {
  onVideoSelect: (file: File) => void;
  selectedFile: File | null;
}

const VideoUpload: React.FC<VideoUploadProps> = ({ onVideoSelect, selectedFile }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      onVideoSelect(file);
    }
  }, [onVideoSelect]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv']
    },
    maxFiles: 1
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive && !isDragReject ? 'border-blue-400 bg-blue-50' : ''}
          ${isDragReject ? 'border-red-400 bg-red-50' : ''}
          ${!isDragActive ? 'border-gray-300 hover:border-gray-400' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          <svg
            className="w-12 h-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          
          {selectedFile ? (
            <div className="text-sm text-gray-600">
              <p className="font-medium text-green-600">Selected: {selectedFile.name}</p>
              <p>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              {isDragActive ? (
                <p>Drop the video here...</p>
              ) : (
                <div>
                  <p className="font-medium">Click to upload or drag and drop</p>
                  <p>MP4, MOV, AVI, or MKV files</p>
                </div>
              )}
            </div>
          )}
          
          {isDragReject && (
            <p className="text-red-500 text-sm">Please upload a valid video file</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoUpload;
