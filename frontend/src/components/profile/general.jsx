import { useAuth } from '../../auth/authContext';
import tokenService from '../../services/tokenService';
import { useEffect, useState } from 'react';
import SubscriptionService from '../../services/activeSubscription';

export default function GeneralProfile() {
    const { user, loading } = useAuth();

    return (
        <section className="relative w-full max-w-4xl mx-auto px-4 mt-[14vh] mb-12">
            <div className="max-w-xl rounded-3xl bg-[#0e1428]/80 backdrop-blur-md border border-white/10 p-6 sm:p-10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] mx-auto">
                <h2 className="text-lg font-semibold text-white mb-4">General Information</h2>

                {/* Name */}
                <InfoRow
                    label="Name"
                    isLoading={loading}
                    value={user?.displayName || '—'}
                />

                {/* Email */}
                <InfoRow
                    label="Email address"
                    isLoading={loading}
                    value={user?.email || '—'}
                    className="mb-2"
                />

                {/* Helper text */}
                <p className="text-sm text-gray-400 mb-4">
                    To change your email, please contact us
                </p>


                <TokenBalance />
            </div>
        </section>
    );
}

function InfoRow({ label, value, isLoading, className = '' }) {
    return (
        <div className={`flex justify-between items-center bg-white/10 dark:bg-gray-800/30 backdrop-blur-md border border-white/20 dark:border-gray-700/40 rounded-xl px-4 py-3 shadow-sm mb-4 ${className}`}>
            <div className="w-full">
                <p className="text-sm text-white/80">{label}</p>
                <p className="text-base font-medium text-white">
                    {isLoading ? <Skeleton width="w-24" /> : value}
                </p>
            </div>
        </div>
    );
}

function TokenBalance() {
    const { user, loading } = useAuth();
    const [balance, setBalance] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function fetchBalance() {
            if (!user) return;
            // If user is on a paid plan, we can skip fetching balance and set to unlimited
            try {
                if (SubscriptionService.getActiveSubscription(user.uid)) {
                    setBalance('∞');
                } else {
                    const res = await tokenService.getBalance(user.uid);
                    if (!cancelled) setBalance(res);
                }
            } catch (e) {
                if (!cancelled) {
                    setError(true);
                    setBalance(0);
                }
            }
        }

        fetchBalance();
        return () => { cancelled = true; };
    }, [user]);

    const showSkeleton = loading || (user && balance === null && !error);

    return (
        <div className="flex justify-between items-center bg-white/10 dark:bg-gray-800/30 backdrop-blur-md border border-white/20 dark:border-gray-700/40 rounded-xl px-4 py-3 shadow-sm mb-4">
            <div className="w-full">
                <p className="text-sm text-white/80">Available Tokens</p>
                <p className="text-base font-medium text-white">
                    {showSkeleton ? (
                        <Skeleton width="w-16" />
                    ) : error ? (
                        <span className="text-red-300">Error</span>
                    ) : (
                        <>
                            <img
                                src="/icons/token.svg"
                                alt=""
                                aria-hidden="true"
                                className="inline-block h-4 w-4 mr-2 align-middle text-emerald-400"
                                style={{ filter: 'invert(43%) sepia(93%) saturate(513%) hue-rotate(100deg) brightness(93%) contrast(92%)' }}
                            />
                            {balance}
                        </>
                    )}
                </p>
            </div>
        </div>
    );
}

function Skeleton({ width = 'w-20', height = 'h-4' }) {
    return (
        <span className={`inline-block ${width} ${height} rounded bg-white/20 animate-pulse align-middle`} />
    );
}