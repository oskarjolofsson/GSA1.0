import { auth } from '../../../lib/firebase';
import { ensureUserReady } from './authHelper';

const API = (import.meta.env.VITE_API_URL || '');

class AnalysisService {
  constructor() {
    this.videoURLCache = {};
  }

  // Helper method for authenticated fetch requests
  async fetchWithAuth(url, method = 'GET') {
    await ensureUserReady();
    console.log("Fetching URL with auth: " + url);

    const user = auth.currentUser;
    if (!user) throw new Error('Not signed in');

    const idToken = await user.getIdToken();

    const response = await fetch(`${API}${url}`, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Server error ${response.status}: ${text || response.statusText}`);
    }

    return await response.json();
  }

  // Fetch all analyses for user
  async getAnalysesForUser() {
    try {
      await ensureUserReady();
      const data = await this.fetchWithAuth('/api/v1/analysis');
      return Array.isArray(data?.analyses) ? data.analyses : [];
    } catch (error) {
      console.error("Error in getAnalysesForUser:", error);
      throw new Error("Could not fetch analyses. Please try again later.");
    }
  }

  // Fetch single analysis by ID
  async getAnalysisById(analysisId) {
    try {
      const data = await this.fetchWithAuth(`/api/v1/analysis/${analysisId}`);
      return data || null;
    } catch (error) {
      console.error("Error in getAnalysisById:", error);
      throw new Error("Could not fetch analysis. Please try again later.");
    }
  }

  // Get paginated analyses
  async getPastAnalyses(offset = 0, limit = 10) {
    try {
      const data = await this.fetchWithAuth(`/api/v1/analysis/get_previous_analyses?offset=${offset}&limit=${limit}`);
      return {
        analyses: Array.isArray(data?.analyses) ? data.analyses : [],
        total: data?.total || 0
      };
    } catch (error) {
      throw new Error("Could not fetch past analyses. Please try again later.");
    }
  }

  // Get signed video URL for analysis with caching
  async getAnalysisVideoURL(analysisId, videoKey) {
    try {
      await ensureUserReady();

      // Check cache first
      if (this.videoURLCache[analysisId]) {
        console.log("Using cached video URL for analysis:", analysisId);
        return this.videoURLCache[analysisId];
      }

      const data = await this.fetchWithAuth(`/api/v1/analysis/${analysisId}/video-url?video_key=${encodeURIComponent(videoKey)}`);
      const url = data?.video_url || null;

      // Cache the result
      if (url) {
        this.videoURLCache[analysisId] = url;
      }

      return url;
    } catch (error) {
      console.error("Error in getAnalysisVideoURL:", error);
      throw new Error("Could not fetch video URL. Please try again later.");
    }
  }

  // Delete analysis
  async deleteAnalysis(analysisId) {
    console.log("Deleting analysis with ID: " + analysisId);
    try {
      await this.fetchWithAuth(`/api/v1/analysis/${analysisId}`, 'DELETE');
    } catch (error) {
      console.error("Error in deleteAnalysis:", error);
      throw new Error("Could not delete analysis. Please try again later.");
    }
  }
}

export default new AnalysisService();
