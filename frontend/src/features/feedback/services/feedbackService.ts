import { apiClient } from '@/lib/apiClient';

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
};
