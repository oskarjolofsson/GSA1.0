import { auth } from '../../../lib/firebase';

const API = import.meta.env.VITE_API_URL;

/**
 * Service for handling video upload and analysis API operations
 * Manages 3-step upload: create analysis → upload video → confirm upload
 */
class UploadService {
  /**
   * Get Firebase auth header for authenticated API requests
   * @returns {Promise<Object>} Auth header object
   * @throws {Error} If user is not signed in
   */
  async getAuthHeader() {
    const user = auth.currentUser;
    if (!user) throw new Error('Not signed in');

    const idToken = await user.getIdToken();
    return {
      'Authorization': `Bearer ${idToken}`,
    };
  }

  /**
   * Execute the complete 3-step video upload process
   * 1. Create analysis record and get signed upload URL
   * 2. Upload video file to Cloudflare R2 (signed URL)
   * 3. Confirm upload completion to trigger backend analysis
   *
   * @param {File} file - The video file to upload
   * @param {Object} advancedInput - Advanced settings (passed to backend)
   * @param {number} startTime - Trim start time in seconds
   * @param {number} endTime - Trim end time in seconds
   * @param {string} AImodel - Selected AI model name
   * @param {Function} onAnalysisCreated - Optional callback after step 1 with analysisId
   * @returns {Promise<Object>} Analysis response data and ID
   * @throws {Error} If any step of the upload fails
   */
  async uploadVideo(file, advancedInput, startTime, endTime, AImodel, onAnalysisCreated = null) {
    if (!file) throw new Error('No file provided');

    try {
      const authHeader = await this.getAuthHeader();

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
        const backendMessage = await this.parseErrorResponse(createRes);
        throw new Error(backendMessage);
      }

      const createData = await createRes.json();
      const newAnalysisId = createData.analysis_id;
      const uploadUrl = createData.upload_url;

      // Notify caller that analysis was created (for early UI transition)
      if (onAnalysisCreated) {
        onAnalysisCreated(newAnalysisId);
      }

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
        const backendMessage = await this.parseErrorResponse(confirmRes);
        throw new Error(backendMessage);
      }

      const confirmData = await confirmRes.json();
      return { analysis: confirmData, analysisId: newAnalysisId };
    } catch (err) {
      throw err;
    }
  }

  /**
   * Check the status of an ongoing analysis
   * @param {string} analysisId - The ID of the analysis to check
   * @returns {Promise<Object>} Status object with status field
   * @throws {Error} If request fails
   */
  async getAnalysisStatus(analysisId) {
    if (!analysisId) throw new Error('No analysis ID provided');

    try {
      const authHeader = await this.getAuthHeader();

      const response = await fetch(API + `/api/v1/analysis/${analysisId}`, {
        method: 'GET',
        headers: authHeader,
      });

      if (!response.ok) {
        const backendMessage = await this.parseErrorResponse(response);
        throw new Error(backendMessage);
      }

      const data = await response.json();
      
      // Extract status from analysis object
      // The backend returns { success: true, analysis: {...}, video_url: "..." }
      const analysis = data.analysis || {};
      return {
        status: analysis.status || 'processing',
        error_message: analysis.error_message || null,
        analysis: analysis,
      };
    } catch (err) {
      throw err;
    }
  }

  /**
   * Parse error response from backend with fallback strategies
   * Tries JSON parsing first, falls back to text
   *
   * @param {Response} response - Fetch response object
   * @returns {Promise<string>} Error message
   */
  async parseErrorResponse(response) {
    try {
      const errorData = await response.json();
      return errorData.error || 'Request failed';
    } catch {
      const text = await response.text();
      return text || 'Request failed';
    }
  }
}

// Export singleton instance
export default new UploadService();
