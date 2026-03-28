import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {useRef } from 'react';

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const hasHandledAuthRef = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        setErrorCode(error.code?.toString() || 'unknown_error')
        return
      }

      if (!data.session || hasHandledAuthRef.current) return;

      if (data.session) {
        // Mark that we've handled the auth callback to prevent multiple redirects
        hasHandledAuthRef.current = true;
        // Use is loggeed in now, redirect to dashboard or intended path
        const redirect = sessionStorage.getItem("postLoginRedirect");
        console.log("Post-login redirect path:", redirect);
        if (redirect && redirect.startsWith("/")) {
          sessionStorage.removeItem("postLoginRedirect");
          navigate(redirect, { replace: true });
        } else {
          navigate("/dashboard/app", { replace: true });
        }
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