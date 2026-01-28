import { auth } from "../../../lib/firebase.js";
import { feedbackService } from "../services/feedbackService.js";

export function useFeedback() {
  const submit = async (rating, comments) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Not signed in");

    const token = await user.getIdToken();
    return feedbackService.submitFeedback(fetch, token, rating, comments);
  };

  return { submit };
}
