import { feedbackService } from "../services/feedbackService.js";
import { useAuth } from "@/features/auth/hooks/useAuth.js";
import { supabase } from '@/lib/supabase.js';

export function useFeedback() {
  const submit = async (rating: number, comments?: string) => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!session) throw new Error("Not signed in");

    const token = session.access_token;
    return feedbackService.submitFeedback(token, rating, comments);
  };

  return { submit };
}
