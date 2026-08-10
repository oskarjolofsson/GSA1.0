import { View, Text, TouchableOpacity, Alert, Linking } from 'react-native';

// Apple clicks both of these during App Review, so they must stay reachable and
// return 200. Verified 2026-08-10.
const PRIVACY_POLICY_URL = 'https://trueswing.se/legal/privacy-policy';
const TERMS_OF_USE_URL = 'https://trueswing.se/legal/terms-and-conditions';

async function openLink(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Error', 'Could not open the link.');
  }
}

/**
 * The auto-renewal disclosure Apple requires verbatim, plus the two legal links.
 *
 * Extracted from PaywallModal because it changes on a different clock than the rest of
 * the screen: the wording is dictated by App Review, not by us, so a design pass must
 * never accidentally reword it. No paywall state, no props.
 *
 * Text is 13px, not the 12px it shipped at — DESIGN.md sets a 13px floor for anything a
 * golfer reads, because the app is used outdoors in sunlight.
 */
export default function PaywallLegal() {
  return (
    <View>
      <Text className="text-[13px] leading-5 text-sand-dim/70">
        Payment is charged to your Apple ID at confirmation. The subscription renews
        automatically at the same price and period unless cancelled at least 24 hours
        before the end of the current period. Manage or cancel anytime in your App Store
        account settings.
      </Text>

      <View className="mt-3 flex-row items-center">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => openLink(TERMS_OF_USE_URL)}
          accessibilityRole="link"
          hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
        >
          <Text className="text-[13px] text-sand-dim underline">Terms of Use</Text>
        </TouchableOpacity>
        <Text className="mx-2 text-[13px] text-sand-dim/50">·</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => openLink(PRIVACY_POLICY_URL)}
          accessibilityRole="link"
          hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
        >
          <Text className="text-[13px] text-sand-dim underline">Privacy Policy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
