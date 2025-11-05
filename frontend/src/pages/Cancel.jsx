import { useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function Cancel() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Simulate a brief loading state as the user is redirected back
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative w-full max-w-4xl mx-auto px-4 mt-[14vh] mb-12">
      <div className="rounded-3xl bg-[#0e1428]/80 backdrop-blur-md border border-white/10 p-6 sm:p-10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] mx-auto max-w-md">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 text-blue-400 animate-spin" />
            <p className="text-lg text-slate-300">Redirecting...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <div className="bg-yellow-900/40 rounded-full p-4 border border-yellow-700/50">
              <AlertCircle className="h-12 w-12 text-yellow-400" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-2">
                Checkout Cancelled
              </h1>
              <p className="text-slate-300 text-lg mb-6">
                Your checkout was not completed.
              </p>
              <p className="text-sm text-slate-400 mb-8">
                No charges have been made to your account. Feel free to try again whenever you're ready.
              </p>
            </div>
            <div className="w-full space-y-3">
              <a
                href="/products"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition text-center block"
              >
                View Plans
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
