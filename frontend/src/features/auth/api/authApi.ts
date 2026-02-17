import { supabase } from '@/lib/supabase'
import { AuthError, Session, User } from '@supabase/supabase-js'
import { data } from 'react-router-dom'

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) throw error
  return data
}

// export async function signInWithPassword(
//   email: string,
//   password: string
// ) {
//   const { data, error } = await supabase.auth.signInWithPassword({
//     email,
//     password,
//   })

//   if (error) throw error
//   return data
// }

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  })

  if (error) throw error
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser()
  return data.user
}
