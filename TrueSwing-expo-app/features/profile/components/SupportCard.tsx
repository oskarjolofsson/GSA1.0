import { Alert, Linking, Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight, CircleHelp } from 'lucide-react-native';

import colors from 'lib/colors';

export const SUPPORT_EMAIL = 'team@trueswing.se';

export default function SupportCard() {
  const handleContactSupport = async () => {
    const subject = encodeURIComponent('Support request');
    const body = encodeURIComponent('Hi TrueSwing,\n\nI need help with my account.\n');

    try {
      await Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
    } catch {
      Alert.alert('Error', 'Could not open the email app.');
    }
  };

  return (
    <View>
      <Text className="font-display text-[18px] text-sand">Support</Text>
      <Text className="mt-1.5 text-[13px] leading-5 text-sand-dim">
        For anything about your account, write to <Text className="text-sand">{SUPPORT_EMAIL}</Text>
        .
      </Text>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleContactSupport}
        accessibilityRole="button"
        className="min-h-[44px] flex-row items-center">
        <CircleHelp
          size={17}
          color={colors.sand}
          strokeWidth={1.75}
          importantForAccessibility="no"
        />
        <Text className="ml-3 flex-1 text-[15px] font-semibold text-sand">Contact support</Text>
        <ChevronRight size={20} color={colors['sand-dim']} />
      </TouchableOpacity>
    </View>
  );
}
