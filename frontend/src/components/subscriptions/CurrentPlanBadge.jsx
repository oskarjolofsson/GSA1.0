import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/authContext';
import { getAuth } from 'firebase/auth';
import { Check } from 'lucide-react';

const URL = import.meta.env.VITE_API_URL;

const PLAN_INFO = {
  'price_1SOya1LTYv4hoLQivA9NcNOl': { name: 'Player', cycle: 'Monthly', price: '€7' },
  'price_1SO1QwLTYv4hoLQiBshbUAUV': { name: 'Player', cycle: 'Yearly', price: '€5/mo' },
  'price_1SOyaOLTYv4hoLQiJptaAZlV': { name: 'Pro', cycle: 'Monthly', price: '€15' },
  'price_1SO1V1LTYv4hoLQiUQl93mv4': { name: 'Pro', cycle: 'Yearly', price: '€10/mo' },
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

        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) {
          if (!cancelled) {
            setActivePriceId(null);
            setPlanInfo(null);
            setFetching(false);
          }
          return;
        }

        const token = await currentUser.getIdToken();
        const res = await fetch(`${URL}/stripe/subscription-status`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();

        if (!cancelled) {
          const priceId = data?.price_id || null;
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
