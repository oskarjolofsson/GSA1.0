import { Pressable, Text, View } from 'react-native';

/**
 * The block screen. Deliberately the emptiest screen in the app: a golfer holding a club does
 * not read their phone between shots, so the pre-drill brief carries the content and this
 * screen only has to be a target you can hit at arm's length with a glove on.
 *
 * What survived: the drill name, and the ambient glow (mounted by the parent) signalling
 * "running" without asking to be read.
 */

type Props = {
  drillTitle: string | null;
  ready: boolean;
  onDone: () => void;
};

export default function DrillInProgress({ drillTitle, ready, onDone }: Props) {
  return (
    <View className="flex-1">
      <View className="flex-1 items-center justify-center">
        <Text className="text-[11px] font-semibold uppercase tracking-[2.5px] text-sand-dim">
          In progress
        </Text>
        <Text
          numberOfLines={2}
          className="mt-4 text-center font-display-bold text-[26px] leading-[32px] text-sand">
          {drillTitle}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !ready }}
        disabled={!ready}
        onPress={onDone}
        // Gold, like every other primary in this flow. It used to be sand, so the
        // action that moves you forward changed colour halfway through a block for
        // no stated reason.
        className={`h-20 items-center justify-center rounded-3xl ${
          ready ? 'bg-gold active:bg-gold-deep' : 'bg-gold/30'
        }`}>
        <Text className="font-sans-bold text-xl text-ink">Done with drill</Text>
      </Pressable>
    </View>
  );
}
