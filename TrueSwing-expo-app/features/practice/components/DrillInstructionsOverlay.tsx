import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Drill } from 'features/drill/types/Drill';
import { parseInstructionSteps } from 'features/shared/utils/parseInstructionSteps';

type DrillInstructionsOverlayProps = {
  visible: boolean;
  drill: Drill | null;
  onClose: () => void;
};

const OPEN_DELAY_MS = 60;
const ENTER_DURATION_MS = 220;
const EXIT_DURATION_MS = 170;

export default function DrillInstructionsOverlay({
  visible,
  drill,
  onClose,
}: DrillInstructionsOverlayProps) {
  const [isMounted, setIsMounted] = useState(visible);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(12)).current;

  const steps = useMemo(() => parseInstructionSteps(drill?.task), [drill?.task]);

  useEffect(() => {
    let enterDelay: ReturnType<typeof setTimeout> | null = null;

    if (visible) {
      setIsMounted(true);
      backdropOpacity.setValue(0);
      contentOpacity.setValue(0);
      contentTranslateY.setValue(12);

      enterDelay = setTimeout(() => {
        Animated.parallel([
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: ENTER_DURATION_MS,
            useNativeDriver: true,
          }),
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: ENTER_DURATION_MS,
            useNativeDriver: true,
          }),
          Animated.timing(contentTranslateY, {
            toValue: 0,
            duration: ENTER_DURATION_MS,
            useNativeDriver: true,
          }),
        ]).start();
      }, OPEN_DELAY_MS);
    } else if (isMounted) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: EXIT_DURATION_MS,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: EXIT_DURATION_MS,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 10,
          duration: EXIT_DURATION_MS,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setIsMounted(false);
        }
      });
    }

    return () => {
      if (enterDelay) clearTimeout(enterDelay);
    };
  }, [backdropOpacity, contentOpacity, contentTranslateY, isMounted, visible]);

  if (!isMounted) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
      statusBarTranslucent>
      <Animated.View style={{ opacity: backdropOpacity }} className="flex-1 bg-ink">
        <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
          <Animated.View
            style={{
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslateY }],
            }}
            className="flex-1">
            <View className="flex-row items-center justify-between border-b border-white/10 bg-ink px-5 py-4">
              <Text className="text-[11px] font-semibold uppercase tracking-[2.2px] text-sand-dim">
                Practice drill
              </Text>

              <Pressable
                onPress={onClose}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 active:bg-white/10"
                accessibilityRole="button"
                accessibilityLabel="Close instructions">
                <Text className="text-xs font-semibold uppercase tracking-[1.6px] text-sand">
                  Close
                </Text>
              </Pressable>
            </View>

            {/* Scrolls. The rail gives each step more vertical room than the old pill did,
                and `task` is admin-authored with no cap on how many steps it can hold, so a
                centred fixed column would push the last steps under the footer on a small
                phone. Same failure mode as the rating grid and the pre-drill brief. */}
            <ScrollView
              className="flex-1"
              contentContainerClassName="flex-grow justify-center py-4"
              showsVerticalScrollIndicator={false}>
              <View className="px-5">
                <Text className="font-display-bold text-3xl leading-[36px] text-white">
                  {drill?.title ?? 'Drill instructions'}
                </Text>
              </View>

              {/* THE RAIL, at last. DESIGN.md specifies it for "a list of things
                                done in order" -- a hairline spine with a gold-stroked node per
                                item and Fraunces numerals in gold beside the text -- and notes
                                that "the rail says sequence so no label has to". These steps
                                were rendering as a stack of bordered pills, which the same
                                document calls "the most generic pattern in mobile design".

                                A drill's `task` IS ordered, so the rail belongs here. Its
                                `success_signal` is NOT ordered, which is why the pre-drill
                                brief uses marks with no spine instead. */}
              <View className="mt-6 px-5">
                {steps.length > 0 ? (
                  steps.map((step, index) => {
                    const isLast = index === steps.length - 1;
                    return (
                      <View key={`${drill?.id ?? 'step'}-${index}`} className="flex-row">
                        <View
                          className="w-5 items-center"
                          accessibilityElementsHidden
                          importantForAccessibility="no">
                          <View
                            className={`h-3.5 w-[1px] ${
                              index === 0 ? 'bg-transparent' : 'bg-sand/[.13]'
                            }`}
                          />
                          <View className="h-2 w-2 rounded-full border border-gold" />
                          <View
                            className={`w-[1px] flex-1 ${
                              isLast ? 'bg-transparent' : 'bg-sand/[.13]'
                            }`}
                          />
                        </View>

                        <View className="flex-1 flex-row gap-3 pb-6 pl-3">
                          <Text className="w-3.5 font-display text-[12px] leading-[28px] text-gold">
                            {index + 1}
                          </Text>
                          <Text className="flex-1 text-[17px] leading-[28px] text-sand">
                            {step}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  /* Not an error -- the drill simply has no steps authored.
                                       DESIGN.md: say the true thing, and "try again later"
                                       invites a retry that cannot help. */
                  <Text className="text-[17px] leading-[28px] text-sand-dim">
                    No steps written up for this drill yet.
                  </Text>
                )}
              </View>
            </ScrollView>

            <View className="border-t border-white/10 bg-ink px-5 py-4">
              <Pressable
                onPress={onClose}
                className="items-center rounded-2xl bg-gold py-4 active:bg-gold-deep"
                accessibilityRole="button"
                accessibilityLabel="Close instructions">
                {/* "Start practice" was a lie once this could be opened
                                    mid-block: the button only closes the sheet. */}
                <Text className="font-sans-bold text-lg text-ink">Got it</Text>
              </Pressable>
            </View>
          </Animated.View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}
