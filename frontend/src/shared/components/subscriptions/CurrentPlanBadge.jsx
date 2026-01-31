import { useEffect, useState } from 'react';
import { useAuth } from '../../../auth/authContext';
import { Check } from 'lucide-react';
import SubscriptionService from '../../../services/activeSubscription';

const playerMonthlyPriceId = import.meta.env.VITE_PRICE_ID_PLAYER_MONTHLY;
  const playerYearlyPriceId = import.meta.env.VITE_PRICE_ID_PLAYER_YEARLY;
  const proMonthlyPriceId = import.meta.env.VITE_PRICE_ID_PRO_MONTHLY;
  const proYearlyPriceId = import.meta.env.VITE_PRICE_ID_PRO_YEARLY;

const PLAN_INFO = {
  [playerMonthlyPriceId]: { name: 'Player', cycle: 'Monthly', price: '€7' },
  [playerYearlyPriceId]: { name: 'Player', cycle: 'Yearly', price: '€5/mo' },
  [proMonthlyPriceId]: { name: 'Pro', cycle: 'Monthly', price: '€15' },
  [proYearlyPriceId]: { name: 'Pro', cycle: 'Yearly', price: '€10/mo' },
};

export default function CurrentPlanBadge({ refreshTrigger = 0 }) {
  const { user, loading } = useAuth();
  const [activePriceId, setActivePriceId] = useState(null);
  const [planInfo, setPlanInfo] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchStatus() {
      try {
        if (!user) {
          if (!cancelled) {
            setActivePriceId(null);
            setPlanInfo(null);
            setFetching(false);
          }
          return;
        }

        const priceId = await SubscriptionService.getActivePriceId();

        if (!cancelled) {
          setActivePriceId(priceId);
          setPlanInfo(priceId ? PLAN_INFO[priceId] : null);
        }
      } catch (err) {
        console.error('Failed to fetch subscription status:', err);
        if (!cancelled) {
          setActivePriceId(null);
          setPlanInfo(null);
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    }

    setFetching(true);
    fetchStatus();
    return () => {
      cancelled = true;
    };
  }, [user, refreshTrigger]);

  if (loading || fetching) {
    return (
      <div className="inline-block px-3 py-1.5 rounded-full bg-white/10 text-white/60 text-sm font-medium">
        Loading...
      </div>
    );
  }

  if (!user || !planInfo) {
    return (
      <div className="inline-block px-3 py-1.5 rounded-full bg-white/10 text-white/60 text-sm font-medium">
        No active plan
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 text-white text-sm font-medium">
      <Check className="w-4 h-4 text-blue-400" />
      <span>{planInfo.name}</span>
      <span className="text-white/60">•</span>
      <span className="text-white/70">{planInfo.cycle}</span>
    </div>
  );
}
