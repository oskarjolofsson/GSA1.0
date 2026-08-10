import { useEffect } from 'react';
import { View, Text, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { useBilling } from 'features/billing/BillingContext';
import { daysLeft } from 'features/billing/utils/Trial';

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

  const sub = status?.subscription ?? null;

  const handleManage = async () => {
    const url = sub?.provider === 'stripe' ? WEB_BILLING_URL : STORE_SUBSCRIPTIONS_URL;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Could not open subscription settings.');
    }
  };

  // No active paid subscription. This covers three cases that all must surface
  // the in-app purchase, so App Review can always locate it:
  //   - free trial in progress (status.has_free_tier)
  //   - trial ended, no purchase yet
  //   - status failed to load (status === null) — still show an upgrade path
  if (!sub) {
    const inTrial = status?.has_free_tier ?? false;
    const remaining = status ? daysLeft(status.free_tier_expires_at) : 0;

    const subtitle = inTrial
      ? `You're on a free trial — ${remaining} ${remaining === 1 ? 'day' : 'days'} left. ` +
        'Subscribe now to keep swing uploads, drills and results after it ends.'
      : 'Subscribe to unlock swing uploads, drills and results.';

    return (
      <View>
        <Text className="font-display text-[18px] text-sand">Subscription</Text>
        <Text className="mt-1.5 text-[13px] leading-5 text-sand-dim">{subtitle}</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => openPaywall('manual')}
          accessibilityRole="button"
          className="mt-4 min-h-[44px] flex-row items-center justify-between border-t border-b border-[rgba(232,220,196,0.13)] py-3.5"
        >
          <View className="flex-1 pr-3">
            <Text className="text-[15px] font-semibold text-sand">View subscription plans</Text>
            <Text className="mt-1 text-[13px] text-sand-dim">TrueSwing Monthly</Text>
          </View>
          <ChevronRight size={20} color="#8A8676" />
        </TouchableOpacity>
      </View>
    );
  }

  const managedOnWeb = sub.provider === 'stripe';

  return (
    <View>
      <Text className="font-display text-[18px] text-sand">Subscription</Text>
      <Text className="mt-1.5 text-[13px] text-sand-dim">
        Status: <Text className="text-sand">{sub.status}</Text>
        {sub.cancel_at_period_end ? ' (cancels at period end)' : ''}
      </Text>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleManage}
        accessibilityRole="button"
        className="mt-4 min-h-[44px] flex-row items-center justify-between border-t border-b border-[rgba(232,220,196,0.13)] py-3.5"
      >
        <View className="flex-1 pr-3">
          <Text className="text-[15px] font-semibold text-sand">Manage subscription</Text>
          <Text className="mt-1 text-[13px] leading-5 text-sand-dim">
            {managedOnWeb
              ? 'Subscription was purchased on the web — manage it there'
              : `Opens your ${Platform.OS === 'ios' ? 'App Store' : 'Play Store'} settings`}
          </Text>
        </View>
        <ChevronRight size={20} color="#8A8676" />
      </TouchableOpacity>
    </View>
  );
}
