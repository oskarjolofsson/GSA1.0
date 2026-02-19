import { AppUser, AuthContextType } from '@/features/auth/types';
import React, { createContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

function mapSupabaseUser(user: User | null): AppUser | null {
  if (!user) return null

  const returnedUser: AppUser = {
    id: user.id,
    email: user.email ?? null,
    name:
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      null,
    photoURL:
      user.user_metadata?.avatar_url ??
      user.user_metadata?.picture ??
      null,
  }
  return returnedUser
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: {children: React.ReactNode}) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession()
            .then(({ data: { session } }) => {
                setSession(session);
                setUser(mapSupabaseUser(session?.user ?? null));
                setLoading(false);
            });

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            setUser(mapSupabaseUser(session?.user ?? null));
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [])

    return (
        <AuthContext.Provider value={{ user, session, loading }}>
            {children}
        </AuthContext.Provider>
    )
    
}
