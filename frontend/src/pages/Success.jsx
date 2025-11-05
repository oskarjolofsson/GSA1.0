import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../auth/authContext';

const URL = import.meta.env.VITE_API_URL;

export default function Success() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifySession = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        
        if (!sessionId) {
          setStatus('error');
          setMessage('No session ID found in URL');
          return;
        }

        const { user } = useAuth(); 

        if (!user) {
          setStatus('error');
          setMessage('You must be signed in to verify your purchase');
          return;
        }

        const token = await user.getIdToken();
        const res = await fetch(`${URL}/stripe/verify-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ session_id: sessionId })
        });

        const data = await res.json();

        if (!res.ok) {
          setStatus('error');
          setMessage('Failed to verify your purchase');
          return;
        }

        setStatus('success');
        setMessage('Thank you for your purchase!');
      } catch (err) {
        console.error('Error verifying session:', err);
        setStatus('error');
        setMessage('An error occurred while verifying your purchase');
      }
    };

    verifySession();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            <p className="text-lg text-gray-600">Verifying your purchase...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-6 bg-white rounded-lg shadow-lg p-8">
            <div className="bg-green-100 rounded-full p-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Purchase Confirmed!
              </h1>
              <p className="text-gray-600 text-lg mb-6">
                Thank you for your purchase. Your subscription is now active!
              </p>
              <p className="text-sm text-gray-500 mb-8">
                {message}
              </p>
            </div>
            <a
              href="/"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              Return to Home
            </a>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-6 bg-white rounded-lg shadow-lg p-8">
            <div className="bg-red-100 rounded-full p-4">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Verification Failed
              </h1>
              <p className="text-gray-600 text-lg mb-6">
                We couldn't verify your purchase.
              </p>
              <p className="text-sm text-red-600 mb-8">
                {message}
              </p>
            </div>
            <div className="w-full space-y-3">
              <a
                href="/profile"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition text-center block"
              >
                Check Your Subscription
              </a>
              <a
                href="/"
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-4 rounded-lg transition text-center block"
              >
                Return to Home
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
