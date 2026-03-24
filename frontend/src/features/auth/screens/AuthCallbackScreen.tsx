import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [errorCode, setErrorCode] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        setErrorCode(error.code?.toString() || 'unknown_error')
        return
      }

      if (data.session) {
        navigate('/dashboard/app')
      } else {
        setErrorCode('no session created')
      }
    }

    handleCallback()
  }, [navigate])

  if (errorCode) {
    return <div>Login failed: {errorCode}</div>
  }

  return <div>Signing in...</div>
}