import { feedbackService } from "../services/feedbackService.js";

export function useFeedback() {
  const submit = async (rating: number, comments?: string) => {
    return feedbackService.submitFeedback(rating, comments);
  };

  return { submit };
}
