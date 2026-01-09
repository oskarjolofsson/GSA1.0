import { auth } from '../lib/firebase';

const API = (import.meta.env.VITE_API_URL || ''); 

class PastDrillService {

  // Helper method for authenticated fetch requests
  async fetchWithAuth(url) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not signed in');
    
    const idToken = await user.getIdToken();
    
    const response = await fetch(`${API}${url}`, {
      method: 'GET',
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

  // Fetch method that uses the helper
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

  async getAnalysisById(analysisId) {
    try {
      await this.ensureUserReady(); // Wait for auth to be ready
      const data = await this.fetchWithAuth(`/api/v1/analysis/${analysisId}`);
      return data.analysis || null;
    } catch (error) {
      console.error("Error in getAnalysisById:", error);
      throw new Error("Could not fetch analysis. Please try again later.");
    }
  }

  // Helper to wait for user to be ready
  async ensureUserReady() {
    return new Promise((resolve, reject) => {
      if (auth.currentUser) {
        resolve();
      } else {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          unsubscribe();
          if (user) {
            resolve();
          } else {
            reject(new Error('Not signed in'));
          }
        });
      }
    });
  }
}

export default new PastDrillService();