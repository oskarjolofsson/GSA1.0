import { Dialog, DialogContent } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { startCheckout } from '../services/billing';
import type { PaywallReason } from '../types';

type Props = {
  open: boolean;
  reason: PaywallReason;
  onClose: () => void;
};

const HEADLINES: Record<PaywallReason, string> = {
  manual: 'Unlock premium',
  gate: 'This is a premium feature',
  '402': 'Your access has expired',
};

const BENEFITS = [
  'Unlimited uploads and analyses',
  'Personalized drill recommendations',
  'Full history and progress tracking',
];

export default function PaywallModal({ open, reason, onClose }: Props) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await startCheckout();
    } catch {
      setError('Could not start checkout. Please try again.');
      setSubmitting(false);
    }
  };

  const handleMaybeLater = () => {
    onClose();
    navigate('/dashboard/app');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'visible', background: 'transparent', boxShadow: 'none' } }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            key="paywall"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="rounded-2xl bg-white shadow-2xl"
          >
            <DialogContent sx={{ p: 0 }}>
              <div className="relative p-7">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="absolute right-4 top-4 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                >
                  <X size={18} />
                </button>

                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Sparkles size={22} />
                </div>

                <h2 className="text-xl font-semibold text-neutral-900">{HEADLINES[reason]}</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Subscribe to keep using the features that help you improve.
                </p>

                <ul className="mt-5 space-y-2.5">
                  {BENEFITS.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-neutral-700">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-500" />
                      {b}
                    </li>
                  ))}
                </ul>

                {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

                <div className="mt-6 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleSubscribe}
                    disabled={submitting}
                    className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {submitting ? 'Redirecting to Stripe…' : 'Subscribe'}
                  </button>
                  <button
                    type="button"
                    onClick={handleMaybeLater}
                    className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </DialogContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
