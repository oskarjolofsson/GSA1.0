import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

/**
 * A floating piece of chrome that borrows the platform's own translucency, in three tiers:
 *
 *   iOS 26+   real Liquid Glass (`UIGlassEffect` via expo-glass-effect) -- the refraction
 *             and specular edge are system-drawn and cannot be reproduced in JS.
 *   iOS <26   a `UIBlurEffect` material, which is what Liquid Glass replaced.
 *   Android   there is no Liquid Glass. The M3 answer is a translucent tonal surface, so
 *             this is Dimezis blur (SDK 31+, `none` below that) over the same hairline.
 *
 * The tier is decided once at module load -- `isLiquidGlassAvailable()` is a build/OS fact,
 * not state, and re-checking it per render would just churn.
 *
 * ALWAYS PASS `radius`, AND NOT AS A PARENT'S `overflow: hidden`. All three tiers are native
 * views that draw their own corners; a JS parent clipping them either does nothing (iOS glass)
 * or leaves a square blur behind a round border.
 *
 * The hairline is ours, not the platform's: at `rgba(232,220,196,.13)` it is DESIGN.md's rule
 * colour, which is what keeps a glass control reading as TrueSwing chrome on a dark screen
 * where the blur alone has almost nothing to pick up.
 */

const LIQUID_GLASS = isLiquidGlassAvailable();

const HAIRLINE = 'rgba(232,220,196,0.13)';

type Props = {
  children?: ReactNode;
  /** Corner radius in px. Square corners are a legitimate 0, so there is no default. */
  radius: number;
  style?: StyleProp<ViewStyle>;
  /** iOS only: lets the glass react to touches. Set it on buttons, not on panels. */
  interactive?: boolean;
};

export default function GlassSurface({ children, radius, style, interactive = false }: Props) {
  const shape: ViewStyle = {
    borderRadius: radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    overflow: 'hidden',
  };

  if (LIQUID_GLASS) {
    return (
      <GlassView
        glassEffectStyle="regular"
        colorScheme="dark"
        isInteractive={interactive}
        style={[shape, style]}>
        {children}
      </GlassView>
    );
  }

  return (
    <BlurView
      tint="systemUltraThinMaterialDark"
      intensity={Platform.OS === 'android' ? 60 : 28}
      blurMethod="dimezisBlurViewSdk31Plus"
      style={[shape, style]}>
      {/* Android below SDK 31 gets no blur at all, and the ink screens behind this are
          nearly black -- without a fill the control would be an empty outline. */}
      {Platform.OS === 'android' ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20,31,48,0.55)' }]} />
      ) : null}
      {children}
    </BlurView>
  );
}
