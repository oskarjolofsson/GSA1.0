import { Text, View } from 'react-native';

/**
 * How far through a focus the golfer is: `4/7` over a segment hairline.
 *
 * NO WORD FOR THE READOUT, deliberately. `ProgramRow` on the home screen already settled
 * this: "PROGRESS IS A FRACTION, NOT PROSE. '2 of 6 grooved' has to be parsed as a sentence;
 * `2/6` in the serif is read in one glance." It also means nothing here needs translating,
 * which matters for a golfer whose English is a second language. Same treatment as the home
 * screen so it is read once and understood everywhere.
 *
 * THE NEWLY FILLED SEGMENT IS GOLD. A bare total is a number the golfer cannot explain --
 * `4/7` shipped on the home screen for months with nothing anywhere saying what moves it.
 * Marking the segment that just changed, next to a line naming which drill it was, teaches
 * the rule by showing it happen.
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
