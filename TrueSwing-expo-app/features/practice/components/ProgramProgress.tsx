import { Text, View } from 'react-native';

/**
 * How far through a focus the golfer is: `4/7` over a segment hairline.
 *
 * A fraction, not prose, matching `ProgramRow` on home so it is read once and understood
 * everywhere -- and so nothing here needs translating.
 *
 * The newly filled segment is gold. A bare total is a number the golfer cannot explain;
 * marking what just changed, beside the drill that changed it, teaches the rule.
 */

type Props = {
  title: string;
  grooved: number;
  total: number;
  /** Count before this session. Segments between this and `grooved` render in gold. */
  groovedBefore?: number;
};

export default function ProgramProgress({ title, grooved, total, groovedBefore }: Props) {
  // A program can legitimately have zero drills if its issue has none linked yet.
  const segments = Array.from({ length: Math.max(total, 0) });
  const before = typeof groovedBefore === 'number' ? groovedBefore : grooved;

  return (
    <View>
      <View className="flex-row items-baseline justify-between gap-x-4">
        <Text
          numberOfLines={2}
          className="min-w-0 flex-1 font-display text-[19px] leading-[24px] text-sand">
          {title}
        </Text>
        <Text
          className="font-display text-[22px] leading-[24px] text-sand"
          accessibilityLabel={`${grooved} of ${total} drills filled in`}>
          {grooved}
          <Text className="font-display text-[15px] text-sand-dim">{`/${total}`}</Text>
        </Text>
      </View>

      {segments.length > 0 ? (
        <View className="mt-3.5 flex-row gap-x-1">
          {segments.map((_, i) => (
            <View
              key={i}
              className={`h-0.5 flex-1 ${
                i < before ? 'bg-sand-dim' : i < grooved ? 'bg-gold' : 'bg-sand/10'
              }`}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
