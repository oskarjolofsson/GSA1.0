import { Pressable } from 'react-native';
import { Menu } from 'lucide-react-native';

import GlassSurface from 'features/shared/components/GlassSurface';
import { tapHaptic } from 'features/shared/utils/haptics';
import colors from 'lib/colors';

const SIZE = 44;

/**
 * The press target is the Pressable, not the glass. A `GlassView` with `isInteractive`
 * reacts to touch visually but does not report presses to JS.
 */
export default function MenuButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        tapHaptic();
        onPress();
      }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Open settings"
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      <GlassSurface
        radius={SIZE / 2}
        interactive
        style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
        <Menu size={20} color={colors.sand} strokeWidth={1.75} />
      </GlassSurface>
    </Pressable>
  );
}
