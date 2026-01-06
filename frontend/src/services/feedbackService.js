const API = import.meta.env.VITE_API_URL
import { auth } from '../lib/firebase';

export class FeedbackService {
  constructor() {
    this.baseURL = '/api/v1/feedback';
  }

  /**
   * Generic fetch method for feedback endpoints
   * @param {string} endpoint - The endpoint after /feedback/ (e.g., 'give', 'history')
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
   * @param {object} body - Request body for POST/PUT requests
   * @returns {Promise<object>} API response
   */
  async fetch(endpoint, method = 'POST', body = null) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not signed in');
    
    const idToken = await user.getIdToken();

    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
      };

      // Add body for POST/PUT requests
      if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(API + `${this.baseURL}/${endpoint}`, options);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Feedback service error:', error);
      throw error;
    }
  }

  /**
   * Submit feedback
   * @param {string} rating - Rating: 'bad', 'medium', or 'good'
   * @param {string} comments - User's feedback/explanation
   * @returns {Promise<object>} API response
   */
  async submitFeedback(rating, comments) {
    if (!rating) {
      throw new Error('Rating is required');
    }

    return this.fetch('give', 'POST', {
      rating,
      comments: comments || '',
    });
  }
}

export default new FeedbackService();
