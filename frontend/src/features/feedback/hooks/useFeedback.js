import { supabase } from '@/lib/supabase';
import { feedbackService } from "../services/feedbackService.js";

export function useFeedback() {
  const submit = async (rating, comments) => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!session) throw new Error("Not signed in");

    const token = session.access_token;
    return feedbackService.submitFeedback(fetch, token, rating, comments);
  };

  return { submit };
}
