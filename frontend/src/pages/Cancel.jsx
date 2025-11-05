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
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            <p className="text-lg text-gray-600">Redirecting...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 bg-white rounded-lg shadow-lg p-8">
            <div className="bg-yellow-100 rounded-full p-4">
              <AlertCircle className="h-12 w-12 text-yellow-600" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Checkout Cancelled
              </h1>
              <p className="text-gray-600 text-lg mb-6">
                Your checkout was not completed.
              </p>
              <p className="text-sm text-gray-500 mb-8">
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
