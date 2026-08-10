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

  // A hairline row, not a bordered pill. DESIGN.md: "a stack of bordered pills is the
  // most generic pattern in mobile design" — the brand separates with air and 1px lines.
  return (
    <View className="mb-4 flex-row items-center justify-between border-t border-b border-[rgba(232,220,196,0.13)] py-3.5">
      <View className="flex-1 pr-3">
        <Text className="text-[13px] text-sand-dim">
          {inTrial
            ? `${remaining} ${remaining === 1 ? 'day' : 'days'} left in your free trial`
            : 'Your free trial has ended'}
        </Text>
      </View>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => openPaywall('manual')}
        accessibilityRole="button"
        className="min-h-[44px] justify-center pl-3"
      >
        <Text className="text-[13px] font-semibold text-sand">Upgrade</Text>
      </TouchableOpacity>
    </View>
  );
}
