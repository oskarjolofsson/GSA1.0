/*
 * PURPOSE: LoadingOverlay component for showing loading state during video analysis
 * 
 * This component provides:
 * 1. A full-screen overlay that blocks user interaction during analysis
 * 2. A spinning animation to indicate processing
 * 3. Customizable message to inform users what's happening
 * 4. Conditional rendering based on isVisible prop
 */

// Import React library
import React from 'react';

// Define the types for the component props
interface LoadingOverlayProps {
  isVisible: boolean;              // Whether to show the overlay
  message?: string;                // Optional custom message
}

// Define the LoadingOverlay component
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible, message = "Analyzing your swing..." }) => {
  // If not visible, don't render anything
  if (!isVisible) return null;

  // Render the overlay
  return (
    // Full-screen overlay with semi-transparent background
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Loading dialog box */}
      <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4">
        <div className="flex flex-col items-center space-y-4">
          {/* Spinning animation */}
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          {/* Loading text */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing...</h3>
            <p className="text-sm text-gray-600">{message}</p>
            <p className="text-xs text-gray-500 mt-2">This may take a few moments</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export the LoadingOverlay component
export default LoadingOverlay;
