import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { ChevronLeft, MoreHorizontal } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GlassSurface from 'features/shared/components/GlassSurface';
import ReelMenu from 'features/analysis/components/ReelMenu';
import colors from 'lib/colors';

const BUTTON = 44;

type AnalysisHeaderOverlayProps = {
  dateLabel?: string;
  onDeletePress: () => void;
  /** Opens the drawing overlay for the swing on screen. */
  onDrawPress?: () => void;
  deleting?: boolean;
  onBack?: () => void;
  isNew?: boolean;
};

export default function AnalysisHeaderOverlay({
  dateLabel = '',
  onDeletePress,
  onDrawPress,
  deleting = false,
  onBack,
  isNew = false,
}: AnalysisHeaderOverlayProps) {
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  const [displayedDate, setDisplayedDate] = useState(dateLabel);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (dateLabel === displayedDate) return;

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -8, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      setDisplayedDate(dateLabel);
      slideAnim.setValue(8);

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    });
  }, [dateLabel, displayedDate, fadeAnim, slideAnim]);

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 z-50 flex-row items-center justify-between px-4"
      style={{ top: insets.top + 8 }}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <GlassSurface
            radius={BUTTON / 2}
            interactive
            style={{
              width: BUTTON,
              height: BUTTON,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {/* 26px, light stroke, nudged left of centre: the system back chevron's
                optical balance, not a UI glyph centred in a box. */}
            <ChevronLeft size={26} color={colors.sand} strokeWidth={2} style={{ marginLeft: -2 }} />
          </GlassSurface>
        </Pressable>
      ) : (
        <View style={{ width: BUTTON, height: BUTTON }} />
      )}

      {displayedDate ? (
        <Animated.View
          pointerEvents="none"
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <GlassSurface
            radius={16}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              height: 32,
            }}>
            <Text className="text-[14px] font-semibold tracking-tight text-sand">
              {displayedDate}
            </Text>
            {isNew ? (
              <View className="ml-2 rounded-full border border-gold px-2 py-0.5">
                <Text className="text-[10px] font-semibold tracking-wide text-gold">NEW</Text>
              </View>
            ) : null}
          </GlassSurface>
        </Animated.View>
      ) : null}

      {deleting ? (
        <View style={{ width: BUTTON }} className="items-end">
          <Text className="text-xs font-medium text-sand/50">Deleting…</Text>
        </View>
      ) : (
        <Pressable
          onPress={() => setMenuOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="More options"
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <GlassSurface
            radius={BUTTON / 2}
            interactive
            style={{
              width: BUTTON,
              height: BUTTON,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <MoreHorizontal size={20} color={colors.sand} />
          </GlassSurface>
        </Pressable>
      )}

      <ReelMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onDraw={() => onDrawPress?.()}
        onDelete={onDeletePress}
      />
    </View>
  );
}
