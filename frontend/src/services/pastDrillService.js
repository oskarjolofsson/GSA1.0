import { auth } from '../lib/firebase';

const API = (import.meta.env.VITE_API_URL || ''); 

class PastDrillService {
  async getPastAnalyses(offset = 0, limit = 10) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not signed in');
      
      const idToken = await user.getIdToken();
      
      const response = await fetch(`${API}/api/v1/analysis/get_previous_analyses?offset=${offset}&limit=${limit}`, {
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

      const data = await response.json();      
      return {
        analyses: Array.isArray(data?.analyses) ? data.analyses : [],
        total: data?.total || 0
      };

    } catch (error) {
      throw new Error("Could not load past analyses. Please try again later.");
    }
  }
}

export default new PastDrillService();
