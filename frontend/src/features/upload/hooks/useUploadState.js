import { useState } from 'react';

/**
 * Custom hook for managing video upload UI state
 * Handles analysis result, upload progress, and error messages
 * @returns {Object} Upload state and setters
 */
export const useUploadState = () => {
  const [analysis, setAnalysis] = useState(null);
  const [analysisId, setAnalysisId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  return {
    analysis,
    setAnalysis,
    analysisId,
    setAnalysisId,
    uploading,
    setUploading,
    errorMessage,
    setErrorMessage,
  };
};
