import { feedbackService } from "../services/feedbackService.js";
import { Feedback } from "../types.js";


interface FeedbackTableActions {
    getAll: () => Promise<Feedback[]>;
}

interface FeedbackTableState {
    feedbacks: Feedback[];
    loading: boolean;
    error: Error | null;
}

export function useFeedback() {
  const submit = async (rating: number, comments?: string) => {
    return feedbackService.submitFeedback(rating, comments);
  };

  const getAll = async () => {
    return await feedbackService.getFeedback();
  };

  return { submit, getAll };
}
