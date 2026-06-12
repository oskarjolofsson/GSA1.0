import { Session } from '@supabase/supabase-js';

export interface AuthContextType {
  user: AppUser | null
  session: Session | null
  loading: boolean
}

export interface AppUser {
  id: string | null;
  email: string | null;
  name: string | null;
  photoURL?: string | null;
}