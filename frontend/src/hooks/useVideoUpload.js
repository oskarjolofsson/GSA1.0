import { useState } from 'react';
import tokenService from '../services/tokenService.js';

const API = import.meta.env.VITE_API_URL;

/**
 * Custom hook for handling video upload and analysis
 * Manages upload state, error handling, and result storage
 */
export const useVideoUpload = () => {
  const [analysis, setAnalysis] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const uploadVideo = async (file, advancedInput, startTime, endTime, tokenCount, hasSubscription, AImodel) => {
    if (!file) return;
    if (uploading) return;

    // Check if user has no tokens and no subscription
    // if (!hasSubscription && tokenCount === 0) {
    //   throw new Error('OUT_OF_TOKENS');
    // }

    setErrorMessage('');
    setUploading(true);

    try {
      const form = new FormData();
      form.append('video', file);

      // Include advanced settings
      for (const [key, value] of Object.entries(advancedInput)) {
        form.append(key, String(value));
      }

      // Append trim times
      form.append('start_time', String(startTime));
      form.append('end_time', String(endTime));
      form.append('model', AImodel);

      // Get user_id from tokenService
      const userId = tokenService.getUserId();
      form.append('user_id', userId);

      const res = await fetch(API + '/api/v1/analysis/upload_video', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        let backendMessage = 'Upload failed';
        try {
          const errorData = await res.json();
          backendMessage = errorData.message || errorData.error || backendMessage;
        } catch {
          const text = await res.text();
          if (text) backendMessage = text;
        }
        setErrorMessage(backendMessage);
        throw new Error(backendMessage);
      }

      const data = await res.json();
      setAnalysis(data.analysis_results);
      
      return data.analysis_results;
    } catch (err) {
      setAnalysis(null);
      const errorMsg = err.message || 'Upload failed';
      setErrorMessage(errorMsg);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return {
    analysis,
    uploading,
    errorMessage,
    uploadVideo,
    setAnalysis,
    setErrorMessage,
  };
};
