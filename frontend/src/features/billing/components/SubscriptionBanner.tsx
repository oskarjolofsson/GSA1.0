import { Link } from 'react-router-dom';
import { Clock, Lock, Sparkles } from 'lucide-react';
import { useBilling } from '../BillingContext';
import { daysLeft } from '../utils/trial';

export default function SubscriptionBanner() {
  const { status } = useBilling();
  if (!status || status.is_subscribed) return null;

  if (status.has_free_tier) {
    const n = daysLeft(status.free_tier_expires_at);
    return (
      <div className="flex items-center justify-between gap-4 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
        <div className="flex items-center gap-3 text-sm text-indigo-900">
          <Clock size={18} className="text-indigo-600" />
          <span>
            Free trial — <strong>{n} {n === 1 ? 'day' : 'days'} left</strong>
          </span>
        </div>
        <Link
          to="/pricing"
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
        >
          Upgrade
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex items-center gap-3 text-sm text-amber-900">
        <Lock size={18} className="text-amber-600" />
        <span>
          Your free trial has ended. Subscribe to keep using premium features.
        </span>
      </div>
      <Link
        to="/pricing"
        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
      >
        <Sparkles size={14} />
        Upgrade
      </Link>
    </div>
  );
}
