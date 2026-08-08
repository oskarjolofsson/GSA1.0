import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ScreenProps } from 'features/shared/types';
import InlineRetry from 'features/library/components/InlineRetry';

import type { UsePromptReturn } from '../hooks/usePrompt';
import { useUploadMisses } from '../hooks/useUploadMisses';
import { Chip, FieldGroup, Section, MissRow } from '../components/PromptControls';

type Props = ScreenProps & {
  prompt: UsePromptReturn;
  onDeleteCache: () => void;
};

/** The shot the golfer was trying to hit. Deliberately app-local: the backend
 *  taxonomy has no height or shape axis — it covers areas, goals and misses — so
 *  there is nothing to read these from. If a shot-shape vocabulary is ever added
 *  server-side, these two lists are what it replaces. */
const HEIGHTS = ['Low', 'Mid', 'High'];
const SHAPES = ['Straight', 'Fade', 'Draw'];

/**
 * Shot details. One scroll separated by hairlines and air — no cards, per
 * DESIGN.md. The misses come from the taxonomy so the vocabulary matches what the
 * analysis was trained on; the old hardcoded list offered "Shank" and "Toe",
 * neither of which the backend has ever known about.
 */
export default function PromptScreen({ onBack, onNext, prompt }: Props) {
  const { prompt: promptData, setDesiredShot, setMiss, setExtra } = prompt;
  const { misses, status, error, retry } = useUploadMisses();

  const [height, setHeight] = useState<string | null>(null);
  const [shape, setShape] = useState<string | null>(null);
  const [selectedMisses, setSelectedMisses] = useState<string[]>([]);

  useEffect(() => {
    setDesiredShot([height, shape].filter(Boolean).join(', '));
  }, [height, shape, setDesiredShot]);

  // The golfer-facing labels go to the prompt, not the keys: the analysis reads
  // prose, and "I slice it" carries more than "SLICE".
  useEffect(() => {
    const labels = misses.filter((m) => selectedMisses.includes(m.key)).map((m) => m.golfer_label);
    setMiss(labels.join(', '));
  }, [selectedMisses, misses, setMiss]);

  const toggleMiss = (key: string) =>
    setSelectedMisses((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-ink"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <Text className="text-[11px] font-semibold uppercase tracking-[2.5px] text-sand-dim">
            Step 3 of 3
          </Text>
          <Text className="mt-3 font-display text-[28px] leading-[34px] text-sand">
            Shot details
          </Text>
          <Text className="mt-2 text-[13px] leading-[19px] text-sand-dim">
            Tell us what you were going for. Both are optional.
          </Text>

          <View className="mt-10">
            <Section eyebrow="The shot you wanted" first>
              <FieldGroup label="Height">
                {HEIGHTS.map((option) => (
                  <Chip
                    key={option}
                    label={option}
                    selected={height === option}
                    onPress={() => setHeight(height === option ? null : option)}
                  />
                ))}
              </FieldGroup>

              <FieldGroup label="Shape">
                {SHAPES.map((option) => (
                  <Chip
                    key={option}
                    label={option}
                    selected={shape === option}
                    onPress={() => setShape(shape === option ? null : option)}
                  />
                ))}
              </FieldGroup>
            </Section>

            <Section eyebrow="Your typical miss">
              {/* Independent fetches fail independently: the shape chips above
                                render regardless, so a dead taxonomy costs this section only. */}
              {status === 'loading' && misses.length === 0 ? (
                <ActivityIndicator color="#8A8676" />
              ) : status === 'error' ? (
                <InlineRetry message={error ?? "Couldn't load the miss list."} onRetry={retry} />
              ) : misses.length === 0 ? (
                <Text className="text-[13px] leading-[19px] text-sand-dim">
                  Nothing here yet. Describe the miss below instead.
                </Text>
              ) : (
                misses.map((miss, index) => (
                  <MissRow
                    key={miss.key}
                    title={miss.golfer_label}
                    blurb={miss.blurb}
                    selected={selectedMisses.includes(miss.key)}
                    last={index === misses.length - 1}
                    onPress={() => toggleMiss(miss.key)}
                  />
                ))
              )}
            </Section>

            <Section eyebrow="Anything else">
              <TextInput
                className="min-h-[88px] border-b border-sand/[.13] pb-3 text-[15px] text-sand"
                placeholder="Conditions, club, what you were working on"
                placeholderTextColor="#8A8676"
                multiline
                textAlignVertical="top"
                value={promptData.extra}
                onChangeText={setExtra}
              />
            </Section>
          </View>
        </ScrollView>

        <View className="flex-row items-center justify-between border-t border-sand/[.13] px-6 pb-4 pt-4">
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            className="min-h-[44px] justify-center pr-4 active:opacity-70">
            <Text className="text-[15px] text-sand-dim">Back</Text>
          </Pressable>

          <Pressable
            onPress={onNext}
            accessibilityRole="button"
            className="min-h-[44px] justify-center rounded-full border border-gold px-7 active:opacity-70">
            <Text className="font-sans-medium text-[15px] text-gold">Start analysis</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
