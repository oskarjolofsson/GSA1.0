import { useEffect } from 'react';
import { View, Text, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { useBilling } from 'features/billing/BillingContext';

// Native store subscription-management deep links.
const STORE_SUBSCRIPTIONS_URL = Platform.select({
  ios: 'https://apps.apple.com/account/subscriptions',
  android: 'https://play.google.com/store/account/subscriptions',
  default: 'https://apps.apple.com/account/subscriptions',
});

// Where stripe (web-purchased) subscriptions are managed.
const WEB_BILLING_URL = `${process.env.EXPO_PUBLIC_WEB_URL ?? 'https://trueswing.se'}/dashboard/profile`;

/**
 * Shows current subscription state and a provider-aware "Manage" action:
 * - revenuecat → native store subscription settings.
 * - stripe     → the web app (a store can't manage a Stripe sub, and vice versa).
 * Re-invalidates on mount since the user may return here after managing billing.
 */
export default function SubscriptionCard() {
  const { status, invalidate, openPaywall } = useBilling();

  useEffect(() => {
    invalidate();
  }, [invalidate]);

  if (!status) return null;

  const sub = status.subscription;

  const handleManage = async () => {
    const url = sub?.provider === 'stripe' ? WEB_BILLING_URL : STORE_SUBSCRIPTIONS_URL;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Could not open subscription settings.');
    }
  };

  // No active paid sub — prompt upgrade instead of manage.
  if (!sub) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => openPaywall('manual')}
        className="rounded-3xl border border-white/10 bg-slate-900 p-5"
      >
        <Text className="text-lg font-semibold text-white">Upgrade to premium</Text>
        <Text className="mt-1 text-sm text-slate-400">
          Unlock swing uploads, drills and results.
        </Text>
      </TouchableOpacity>
    );
  }

  const managedOnWeb = sub.provider === 'stripe';

  return (
    <View className="rounded-3xl border border-white/10 bg-slate-900 p-5">
      <Text className="text-lg font-semibold text-white">Subscription</Text>
      <Text className="mt-1 text-sm text-slate-400">
        Status: <Text className="text-slate-200">{sub.status}</Text>
        {sub.cancel_at_period_end ? ' (cancels at period end)' : ''}
      </Text>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleManage}
        className="mt-4 flex-row items-center justify-between rounded-2xl border border-white/10 bg-slate-800 px-4 py-4"
      >
        <View className="flex-1 pr-3">
          <Text className="text-base font-semibold text-white">Manage subscription</Text>
          <Text className="mt-1 text-sm text-slate-400">
            {managedOnWeb
              ? 'Purchased on the web — manage it there'
              : `Opens your ${Platform.OS === 'ios' ? 'App Store' : 'Play Store'} settings`}
          </Text>
        </View>
        <ChevronRight size={20} color="#94a3b8" />
      </TouchableOpacity>
    </View>
  );
}
