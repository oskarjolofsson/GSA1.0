import { View, Text } from 'react-native';

/**
 * Four gold L-brackets and one line of guidance, over the viewfinder.
 *
 *   ┌                    ┐     the brackets are a framing aid, not decoration:
 *                              a swing filmed too close or off-centre is the
 *                              single most common reason an analysis comes back
 *   └                    ┘     vague, and nothing in the old screen said so.
 *
 * Gold at 1px, which is the one place a stroke over live video still reads. Cream
 * would compete with the ball; a fill would be a SaaS move.
 */
export default function FramingGuide({ hidden }: { hidden: boolean }) {
  if (hidden) return null;

  return (
    <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
      <View className="h-[58%] w-[78%]">
        <Corner className="left-0 top-0 border-l border-t" />
        <Corner className="right-0 top-0 border-r border-t" />
        <Corner className="bottom-0 left-0 border-b border-l" />
        <Corner className="bottom-0 right-0 border-b border-r" />
      </View>

      <Text
        className="mt-8 text-[11px] font-semibold uppercase tracking-[2.5px] text-sand"
        style={{
          textShadowColor: 'rgba(0,0,0,0.9)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 4,
        }}>
        Down the line · Waist height
      </Text>
    </View>
  );
}

function Corner({ className }: { className: string }) {
  return <View className={`absolute h-8 w-8 border-gold ${className}`} />;
}
