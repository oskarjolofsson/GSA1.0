import { Pressable, Text, View } from 'react-native';

import { GRADE_LABEL, type BlockFeel } from '../utils/blockFeel';

const FEEL_ORDER: BlockFeel[] = ['rough', 'ok', 'dialed'];

type Props = {
  onPick: (feel: BlockFeel) => void;
  disabled?: boolean;
};

/**
 * Rough / OK / Dialed.
 *
 * The original rating UI, and now also the fallback the whole metric system leans on. It
 * renders for a feel-only drill AND for a metric type this build has never heard of --
 * `drills.metric` is authored in the admin CMS, so a new type can reach an old app without
 * a release. The golfer has already hit the balls by then; the one unacceptable outcome is
 * a screen they cannot finish. This always completes.
 */
export default function FeelPicker({ onPick, disabled = false }: Props) {
  return (
    <View className="flex-row gap-3">
      {FEEL_ORDER.map((feel) => (
        <Pressable
          key={feel}
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={() => onPick(feel)}
          className={`h-24 flex-1 items-center justify-center rounded-3xl border border-white/10 ${
            disabled ? 'bg-white/5' : 'bg-ink-raised active:bg-white/10'
          }`}>
          <Text className="font-sans-bold text-lg text-sand">{GRADE_LABEL[feel]}</Text>
        </Pressable>
      ))}
    </View>
  );
}
