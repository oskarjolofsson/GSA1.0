import React from 'react';
import { StyleSheet, TextInput } from 'react-native';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface Props {
  startMs: SharedValue<number>;
  endMs: SharedValue<number>;
  textColor?: string;
}

// Inlined formatter — must run inside the worklet, so kept self-contained instead of
// importing fmtSec from features/upload/components/theme.ts (the new worklets plugin
// won't auto-workletize cross-file helpers reliably).
function formatSpan(ms: number): string {
  'worklet';
  const s = Math.max(0, ms / 1000);
  if (s < 60) return s.toFixed(1) + 's';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toFixed(1).padStart(4, '0')}`;
}

// The duration readout used to live as React state in the old trim bar, so it forced
// re-renders on every gesture frame. Here we drive it through animatedProps on a
// non-editable TextInput — the `text` prop is forwarded as a native prop without
// touching the React tree. Zero re-renders during a drag.
const DurationLabel = ({ startMs, endMs, textColor = '#EBEBF5CC' }: Props) => {
  const animatedProps = useAnimatedProps(() => {
    const span = Math.max(0, endMs.value - startMs.value);
    return { text: formatSpan(span), defaultValue: formatSpan(span) } as any;
  });

  return (
    <AnimatedTextInput
      editable={false}
      underlineColorAndroid="transparent"
      style={[s.label, { color: textColor }]}
      animatedProps={animatedProps}
    />
  );
};

const s = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'left',
    paddingHorizontal: 16,
    marginBottom: 10,
    padding: 0,
  },
});

export default React.memo(DurationLabel);
