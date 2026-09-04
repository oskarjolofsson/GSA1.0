import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import type { ImageSourcePropType } from 'react-native';

import Avatar from 'features/shared/components/Avatar';

const SAND = '#EADFC8';
const CORNER = 42;

type Props = {
  image: ImageSourcePropType | null;
  title: string;
  subtitle: string;
  photoURL?: string | null;
  name?: string | null;
  email?: string | null;
  onOpenProfile: () => void;
  onAddFocus: () => void;
};

export const HERO_HEIGHT = 360;

/**
 * The photographic header: picture, scrim, greeting, and the app's only two chrome controls
 * (`+` opens the focus drawer, the avatar opens the profile).
 *
 * The scrim is a gradient, which DESIGN.md otherwise forbids, and both controls are cream
 * rather than gold. See ADR-0025.
 *
 * No image is a normal state (an empty HERO_IMAGES list, or a remote one that fails): the
 * block renders as plain ink and the greeting is unaffected.
 */
export default function HomeHero({
  image,
  title,
  subtitle,
  photoURL,
  name,
  email,
  onOpenProfile,
  onAddFocus,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ height: HERO_HEIGHT }} className="w-full overflow-hidden bg-ink">
      {image ? (
        <Image
          source={image}
          resizeMode="cover"
          // Panoramic source; this keeps the horizon high and the sun
          // low-right, clear of the greeting and the avatar.
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          accessible={false}
        />
      ) : null}

      {image ? (
        <LinearGradient
          colors={['rgba(10,15,26,0.46)', 'rgba(10,15,26,0.22)', 'rgba(10,15,26,0.80)', '#0A0F1A']}
          locations={[0, 0.34, 0.76, 1]}
          style={{ position: 'absolute', inset: 0 }}
          pointerEvents="none"
        />
      ) : null}

      <View
        className="flex-row items-start justify-between px-6"
        style={{ paddingTop: insets.top + 12 }}>
        <Pressable
          onPress={onAddFocus}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Add a focus"
          className="items-center justify-center rounded-full border-[1.5px] border-sand"
          style={({ pressed }) => ({ width: CORNER, height: CORNER, opacity: pressed ? 0.6 : 1 })}>
          <Plus size={20} color={SAND} strokeWidth={2} />
        </Pressable>

        <Pressable
          onPress={onOpenProfile}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          className="rounded-full">
          <Avatar photoURL={photoURL} name={name} email={email} size={CORNER} />
        </Pressable>
      </View>

      {/* The greeting drops below the controls rather than sharing their row.
          Sharing it cost the title its width and pushed it against the avatar. */}
      <View className="px-6 pt-5">
        <Text className="font-display text-[28px] leading-[32px] text-sand">{title}</Text>
        <Text className="mt-1.5 text-[13px] leading-[19px] text-sand/80">{subtitle}</Text>
      </View>
    </View>
  );
}
