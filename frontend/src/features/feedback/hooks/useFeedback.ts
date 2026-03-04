import { feedbackService } from "../services/feedbackService.js";

export function useFeedback() {
  const submit = async (rating: number, comments?: string) => {
    return feedbackService.submitFeedback(rating, comments);
  };

  const getAll = async () => {
    return await feedbackService.getFeedback();
  };

  return { submit, getAll };
}
