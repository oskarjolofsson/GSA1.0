import { useState, useEffect } from 'react';
import tokenService from '../services/tokenService.js';
import SubscriptionService from '../services/activeSubscription.js';

/**
 * Custom hook for fetching subscription and token balance
 * Handles subscription status and token count state
 */
export const useSubscriptionAndTokens = () => {
  const [tokenCount, setTokenCount] = useState(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const hasActive = await SubscriptionService.getActiveSubscription();
        if (mounted) setHasSubscription(hasActive);

        if (!hasActive) {
          const count = await tokenService.getBalance();
          if (mounted) setTokenCount(count);
        }
      } catch (e) {
        console.error('Error fetching token balance:', e);
        if (mounted) setError('Could not fetch token balance');
      }
    })();
    return () => { mounted = false; };
  }, []);

  return {
    tokenCount,
    hasSubscription,
    error,
    setTokenCount,
  };
};
