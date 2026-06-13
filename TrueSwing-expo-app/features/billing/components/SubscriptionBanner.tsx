import { View, Text, TouchableOpacity } from 'react-native';
import { useBilling } from 'features/billing/BillingContext';
import { daysLeft } from 'features/billing/utils/Trial';

/**
 * Trial / expired banner. Renders nothing for an active paid subscriber.
 * - In trial: days remaining + Upgrade.
 * - Trial ended, no sub: "trial ended" + Upgrade.
 */
export default function SubscriptionBanner() {
  const { status, openPaywall } = useBilling();

  if (!status || status.is_subscribed) return null;

  const inTrial = status.has_free_tier;
  const remaining = daysLeft(status.free_tier_expires_at);

  return (
    <View className="mb-4 flex-row items-center justify-between rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3">
      <View className="flex-1 pr-3">
        {inTrial ? (
          <Text className="text-sm font-medium text-indigo-200">
            {remaining} {remaining === 1 ? 'day' : 'days'} left in your free trial
          </Text>
        ) : (
          <Text className="text-sm font-medium text-indigo-200">
            Your free trial has ended
          </Text>
        )}
      </View>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => openPaywall('manual')}
        className="rounded-xl bg-indigo-500 px-4 py-2"
      >
        <Text className="text-sm font-semibold text-white">Upgrade</Text>
      </TouchableOpacity>
    </View>
  );
}
