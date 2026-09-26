import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';

import colors from 'lib/colors';

/**
 * PLACEHOLDER. The middle tab is claimed but not yet built -- filming, picking, and
 * trimming a swing still live behind the hero `+` and `features/upload`.
 */
export default function NewSwingScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 items-center justify-center bg-ink px-10"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 90 }}>
      <View className="h-16 w-16 items-center justify-center rounded-full border-[1.5px] border-sand-dim">
        <Plus size={26} color={colors['sand-dim']} strokeWidth={1.75} />
      </View>

      <Text className="mt-7 text-center font-display text-[22px] leading-[27px] text-sand">
        New swing
      </Text>
      <Text className="mt-2.5 text-center text-[13px] leading-[19px] text-sand-dim">
        Filming and uploading a swing will live here. For now, start one from the{' '}
        <Text className="text-sand">+</Text> on home.
      </Text>
    </View>
  );
}
