import { apiClient } from '@/lib/apiClient';
import { Feedback } from '../types';

export const feedbackService = {
  async submitFeedback(
    rating: number,
    comments?: string
  ) {
    if (!rating) {
      throw new Error("Rating is required");
    }

    return apiClient.post('/api/v1/feedback', {
      rating,
      comments: comments ?? "",
    });
  },

  async getFeedback() {
    return apiClient.get<Feedback[]>('/api/v1/feedback') as Promise<Feedback[]>;
  },

};
