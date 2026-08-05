import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ImageSourcePropType } from 'react-native';

import Avatar from 'features/shared/components/Avatar';

type Props = {
  image: ImageSourcePropType | null;
  title: string;
  subtitle: string;
  photoURL?: string | null;
  name?: string | null;
  email?: string | null;
  onOpenProfile: () => void;
};

export const HERO_HEIGHT = 360;

/**
 * The photographic header: picture, scrim, greeting, avatar.
 *
 *  ┌──────────────────────────────┐
 *  │ photo (cover, 76% 48%)       │  the crop keeps the sun low-right,
 *  │ ░ scrim ░░░░░░░░░░░░░░░░░░░░ │  away from the avatar
 *  │  Hello, Oskar        (avatar)│  greeting sits on the calm sky
 *  │  Two areas on the go…        │
 *  │ ▓▓▓ fades to ink ▓▓▓▓▓▓▓▓▓▓▓ │  base blends into the screen
 *  └──────────────────────────────┘
 *
 * THE SCRIM IS A GRADIENT, WHICH DESIGN.md SAYS DO NOT EXIST HERE.
 * Deliberate, and the same shape of exception as `danger`: the brand book never
 * anticipated a photograph, and without a scrim the greeting sits on open sky at
 * roughly 2:1 contrast, which fails the 4.5:1 floor and fails invisibly. It is a
 * legibility device, not decoration — never use a gradient to make something look
 * nicer. If this survives review it belongs written into DESIGN.md, or the next
 * feature re-derives it and drifts.
 *
 * No image is a normal state (an empty HERO_IMAGES list, or a remote one that
 * fails): the block renders as plain ink and the greeting is unaffected.
 */
export default function HomeHero({
  image,
  title,
  subtitle,
  photoURL,
  name,
  email,
  onOpenProfile,
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
        <View className="flex-1 pr-4">
          <Text className="font-display text-[28px] leading-[32px] text-sand">{title}</Text>
          <Text className="mt-1.5 text-[13px] leading-[19px] text-sand/80">{subtitle}</Text>
        </View>

        <Pressable
          onPress={onOpenProfile}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          className="rounded-full">
          <Avatar photoURL={photoURL} name={name} email={email} size={42} />
        </Pressable>
      </View>
    </View>
  );
}
