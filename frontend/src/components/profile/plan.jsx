import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/authContext';
import PriceTable from '../subscriptions/PricingTable.jsx';
import { TrendingDown } from 'lucide-react';
import { getAuth } from 'firebase/auth';



const URL = import.meta.env.VITE_API_URL;

export default function SubscriptionPlan() {
    const { user, loading } = useAuth();
    const [hasSubscription, setHasSubscription] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    // Fetch subscription status to decide whether to show the cancel button
    useEffect(() => {
        let cancelled = false;
        async function fetchStatus() {
            try {
                if (!user) {
                    if (!cancelled) setHasSubscription(false);
                    return;
                }
                const auth = getAuth();
                const currentUser = auth.currentUser;
                if (!currentUser) {
                    if (!cancelled) setHasSubscription(false);
                    return;
                }
                const token = await currentUser.getIdToken();
                const res = await fetch(`${URL}/stripe/subscription-status`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!res.ok) throw new Error(await res.text());
                const data = await res.json();
                if (!cancelled) setHasSubscription(Boolean(data?.price_id));
            } catch (e) {
                console.error('Failed to determine subscription status', e);
                if (!cancelled) setHasSubscription(false);
            }
        }
        fetchStatus();
        return () => { cancelled = true; };
    }, [user]);

    const handleCancel = async () => {
        if (!user || isCancelling) return;
        try {
            setIsCancelling(true);
            const auth = getAuth();
            const currentUser = auth.currentUser;
            if (!currentUser) return;
            const token = await currentUser.getIdToken();
            const res = await fetch(`${URL}/stripe/cancel-subscription`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error || 'Failed to cancel subscription');
            }
            alert('Subscription will cancel at period end.');
            // Optimistically hide the button now
            setHasSubscription(false);
        } catch (e) {
            console.error(e);
            alert('Could not cancel subscription. Please try again.');
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <section className="relative w-full max-w-4xl mx-auto px-4 mt-[14vh] mb-12">
            <div className="max-w-xl rounded-3xl bg-[#0e1428]/80 backdrop-blur-md border border-white/10 p-6 sm:p-10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] mx-auto">
                <h2 className="text-lg font-semibold text-white">Subscription plan</h2>
                <PriceTable />

                {/* Cancel subscription button: only show when user is signed in AND has an active subscription */}
                {user && !loading && hasSubscription && (
                    <div className="flex select-none justify-center">
                        <button
                            onClick={handleCancel}
                            disabled={isCancelling}
                            className="flex items-center text-red-400 hover:text-red-500 disabled:opacity-60 cursor-pointer transition-colors duration-200"
                        >
                            <TrendingDown className="h-5 w-5 mr-2" />
                            <span className="font-medium">
                                {isCancelling ? 'Cancelling…' : 'Cancel Subscription'}
                            </span>
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
