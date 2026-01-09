import { useState } from 'react';
import tokenService from '../services/tokenService.js';
import { auth } from '../lib/firebase';

const API = import.meta.env.VITE_API_URL;

/**
 * Custom hook for handling video upload and analysis
 * Manages upload state, error handling, and result storage
 * Flow: 1) Create analysis 2) Upload video to signed URL 3) Confirm upload
 */
export const useVideoUpload = () => {
  const [analysis, setAnalysis] = useState(null);
  const [analysisId, setAnalysisId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const getAuthHeader = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not signed in');
    
    const idToken = await user.getIdToken();

    return {
      'Authorization': `Bearer ${idToken}`,
    };
  };

  const uploadVideo = async (file, advancedInput, startTime, endTime, tokenCount, hasSubscription, AImodel) => {
    if (!file) return;
    if (uploading) return;

    setErrorMessage('');
    setUploading(true);

    try {
      const authHeader = await getAuthHeader();

      // Step 1: Create analysis and get signed upload URL
      const createForm = new FormData();
      createForm.append('start_time', String(startTime));
      createForm.append('end_time', String(endTime));
      createForm.append('model', AImodel);

      // Include advanced settings
      for (const [key, value] of Object.entries(advancedInput)) {
        createForm.append(key, String(value));
      }

      const createRes = await fetch(API + '/api/v1/analysis/create', {
        method: 'POST',
        headers: authHeader,
        body: createForm,
      });

      if (!createRes.ok) {
        let backendMessage = 'Failed to create analysis';
        try {
          const errorData = await createRes.json();
          backendMessage = errorData.error || backendMessage;
        } catch {
          const text = await createRes.text();
          if (text) backendMessage = text;
        }
        setErrorMessage(backendMessage);
        throw new Error(backendMessage);
      }

      const createData = await createRes.json();
      const newAnalysisId = createData.analysis_id;
      const uploadUrl = createData.upload_url;

      setAnalysisId(newAnalysisId);

      // Step 2: Upload video to signed R2 URL
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'video/mp4',
        },
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload video to storage');
      }

      // Step 3: Confirm upload and trigger analysis
      const confirmRes = await fetch(API + `/api/v1/analysis/${newAnalysisId}/uploaded`, {
        method: 'POST',
        headers: authHeader,
      });

      if (!confirmRes.ok) {
        let backendMessage = 'Failed to confirm upload';
        try {
          const errorData = await confirmRes.json();
          backendMessage = errorData.error || backendMessage;
        } catch {
          const text = await confirmRes.text();
          if (text) backendMessage = text;
        }
        setErrorMessage(backendMessage);
        throw new Error(backendMessage);
      }

      const confirmData = await confirmRes.json();
      setAnalysis(confirmData);

      return { analysis: confirmData, id: newAnalysisId };
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
    analysisId,
    uploading,
    errorMessage,
    uploadVideo,
    setAnalysis,
    setErrorMessage,
  };
};
