import { useState, useCallback, useRef, useEffect } from 'react';
import uploadService from '../services/uploadService.js';

const POLLING_INTERVAL = 2000; // 2 seconds
const TIMEOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Custom hook to manage the complete upload → analyzing → completion flow
 * Handles upload initiation, status polling, timeout detection, and error states
 *
 * @param {Function} onComplete - Callback when analysis completes (receives analysisId)
 * @param {Function} onError - Callback when error occurs (receives error message)
 * @returns {Object} Hook state and control functions
 */
export function useUploadAndAnalyze(onComplete, onError) {
  const [isUploading, setIsUploading] = useState(false);
  const [analysisId, setAnalysisId] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState(null);
  const [error, setError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);

  const pollingIntervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const uploadStartTimeRef = useRef(null);

  // Cleanup intervals and timeouts on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  /**
   * Check analysis status by fetching from backend
   * @param {string} id - Analysis ID to check
   * @returns {Promise<Object>} Analysis status data
   */
  const checkAnalysisStatus = useCallback(async (id) => {
    try {
      const status = await uploadService.getAnalysisStatus(id);
      return status;
    } catch (err) {
      console.error('Failed to check analysis status:', err);
      throw err;
    }
  }, []);

  /**
   * Start polling for analysis completion
   * @param {string} id - Analysis ID to poll
   */
  const startPolling = useCallback((id) => {
    uploadStartTimeRef.current = Date.now();

    // Set timeout for 5 minutes
    timeoutRef.current = setTimeout(() => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      const errorMsg = 'Analysis took too long (over 5 minutes). Please try again.';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    }, TIMEOUT_DURATION);

    // Poll for status
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const status = await checkAnalysisStatus(id);
        setAnalysisStatus(status);

        // Check if analysis is complete
        if (status.status === 'completed') {
          clearInterval(pollingIntervalRef.current);
          clearTimeout(timeoutRef.current);
          setIsComplete(true);
          if (onComplete) onComplete(id);
        } else if (status.status === 'failed' || status.status === 'error') {
          clearInterval(pollingIntervalRef.current);
          clearTimeout(timeoutRef.current);
          const errorMsg = status.error_message || 'Analysis failed. Please try again.';
          setError(errorMsg);
          if (onError) onError(errorMsg);
        }
      } catch (err) {
        console.error('Polling error:', err);
        // Continue polling on transient errors
      }
    }, POLLING_INTERVAL);
  }, [checkAnalysisStatus, onComplete, onError]);

  /**
   * Execute upload and start monitoring
   * @param {File} file - Video file to upload
   * @param {Object} advancedInput - Advanced settings
   * @param {number} startTime - Trim start time
   * @param {number} endTime - Trim end time
   * @param {string} AImodel - AI model name
   */
  const startUpload = useCallback(
    async (file, advancedInput, startTime, endTime, AImodel) => {
      setIsUploading(true);
      setError(null);
      setIsComplete(false);

      try {
        const result = await uploadService.uploadVideo(
          file,
          advancedInput,
          startTime,
          endTime,
          AImodel,
          // Callback fired after step 1 - set analysisId early for UI transition
          (earlyAnalysisId) => {
            setAnalysisId(earlyAnalysisId);
          }
        );

        // Start polling for completion (analysisId already set from callback)
        startPolling(result.analysisId);
      } catch (err) {
        const errorMsg = err.message || 'Upload failed';
        setError(errorMsg);
        setIsUploading(false);
        if (onError) onError(errorMsg);
      }
    },
    [startPolling, onError]
  );

  /**
   * Reset all state for retrying
   */
  const reset = useCallback(() => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsUploading(false);
    setAnalysisId(null);
    setAnalysisStatus(null);
    setError(null);
    setIsComplete(false);
  }, []);

  return {
    isUploading,
    analysisId,
    analysisStatus,
    error,
    isComplete,
    startUpload,
    reset,
  };
}
