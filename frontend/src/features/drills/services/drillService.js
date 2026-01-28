import { auth } from '../../../lib/firebase';
import { ensureUserReady } from '../../analysis/services/authHelper';

const API = (import.meta.env.VITE_API_URL || '');

class DrillService {
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

  // Fetch drill by ID
  async getDrill(drillId) {
    try {
      await ensureUserReady();
      const data = await this.fetchWithAuth(`/api/v1/drill/${drillId}`);
      return data.drill || null;
    } catch (error) {
      console.error("Error in getDrill:", error);
      throw new Error("Could not fetch drill. Please try again later.");
    }
  }
}

export default new DrillService();
