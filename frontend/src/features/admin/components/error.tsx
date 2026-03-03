

import { getErrorMessage } from '@/lib/errors';

interface LoadingStateProps {
    title: string;
    message?: string;
}

/**
 * Reusable loading state component for admin screens
 */
export function LoadingState({ title, message }: LoadingStateProps) {
    return (
        <div className="justify-center p-10">
            <div className="text-3xl font-bold mb-6 text-white ml-6">{title}</div>
            <div className="ml-6 mt-8">
                <div className="bg-[#0e1428]/80 backdrop-blur-md border border-white/10 rounded-lg p-6">
                    <p className="text-white/60">{message || 'Loading...'}</p>
                </div>
            </div>
        </div>
    );
}

interface ErrorStateProps {
    title: string;
    error: unknown;
    onRetry?: () => void;
}

/**
 * Reusable error state component for admin screens.
 * Automatically formats the error message based on error type and status code.
 */
export function ErrorState({ title, error, onRetry }: ErrorStateProps) {
    const errorMessage = getErrorMessage(error);

    return (
        <div className="justify-center p-10">
            <div className="text-3xl font-bold mb-6 text-white ml-6">{title}</div>
            <div className="ml-6 mt-8">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
                    <p className="text-red-500">{errorMessage}</p>
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-white transition-colors"
                        >
                            Retry
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}