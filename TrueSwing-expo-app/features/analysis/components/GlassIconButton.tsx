import type { ReactNode } from 'react';
import { Pressable } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

import GlassSurface from 'features/shared/components/GlassSurface';
import colors from 'lib/colors';

export const GLASS_BUTTON = 44;
export const CHROME_INSET = 16;
export const CHROME_TOP_GAP = 8;

type GlassIconButtonProps = {
  onPress: () => void;
  icon: ReactNode;
  accessibilityLabel: string;
  hitSlop?: number;
};

export default function GlassIconButton({
  onPress,
  icon,
  accessibilityLabel,
  hitSlop = 8,
}: GlassIconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) =>
        pressed ? { opacity: 0.6, transform: [{ scale: 0.97 }] } : undefined
      }>
      <GlassSurface
        radius={GLASS_BUTTON / 2}
        interactive
        style={{
          width: GLASS_BUTTON,
          height: GLASS_BUTTON,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {icon}
      </GlassSurface>
    </Pressable>
  );
}

export function BackChevronButton({ onPress }: { onPress: () => void }) {
  return (
    <GlassIconButton
      onPress={onPress}
      accessibilityLabel="Back"
      icon={
        <ChevronLeft size={26} color={colors.sand} strokeWidth={2} style={{ marginLeft: -2 }} />
      }
    />
  );
}
