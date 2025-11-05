import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../auth/authContext';

const URL = import.meta.env.VITE_API_URL;

export default function Success() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            setStatus('error');
            setMessage('Please sign in to view your purchase');
            return;
        }
        const verifySession = async () => {
            try {
                const sessionId = searchParams.get('session_id');

                const token = await user.getIdToken();

                console.log('Verifying session with ID:', sessionId);
                console.log("API URL:", URL + "/stripe/verify-session");
                const res = await fetch(`${URL}/stripe/verify-session?session_id=${sessionId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await res.json();

                if (!res.ok) {
                    setStatus('error');
                    setMessage('Failed to verify your purchase');
                    console.error('Verification failed:', data);
                    return;
                }

                setStatus('success');
                setMessage('Thank you for your purchase! Your subscription is now active.');
            } catch (err) {
                console.error('Error verifying session:', err);
                setStatus('error');
                setMessage('An error occurred while verifying your purchase');
            }
        };

        verifySession();
    }, [searchParams]);

    return (
        <section className="relative w-full max-w-4xl mx-auto px-4 mt-[14vh] mb-12">
            <div className="rounded-3xl bg-[#0e1428]/80 backdrop-blur-md border border-white/10 p-6 sm:p-10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] mx-auto max-w-md">
                {status === 'loading' && (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-12 w-12 text-blue-400 animate-spin" />
                        <p className="text-lg text-slate-300">Verifying your purchase...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center gap-6">
                        <div className="bg-green-900/40 rounded-full p-4 border border-green-700/50">
                            <CheckCircle className="h-12 w-12 text-green-400" />
                        </div>
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-white mb-2">
                                Purchase Confirmed!
                            </h1>
                            <p className="text-sm text-slate-400 mb-8">
                                {message}
                            </p>
                        </div>
                        <a
                            href="/"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition text-center block"
                        >
                            Return to Home
                        </a>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center gap-6">
                        <div className="bg-red-900/40 rounded-full p-4 border border-red-700/50">
                            <AlertCircle className="h-12 w-12 text-red-400" />
                        </div>
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-white mb-2">
                                Verification Failed
                            </h1>
                            <p className="text-slate-300 text-lg mb-6">
                                We couldn't verify your purchase.
                            </p>
                            <p className="text-sm text-red-400 mb-8">
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
                                className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-lg transition text-center block border border-white/10"
                            >
                                Return to Home
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
