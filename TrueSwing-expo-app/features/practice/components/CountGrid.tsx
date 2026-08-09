import { Pressable, ScrollView, Text, View } from 'react-native';

type Props = {
  reps: number;
  value: number | null;
  onSelect: (value: number) => void;
  disabled?: boolean;
};

/**
 * Pick a whole number from 0 to reps.
 *
 * Two columns of large tiles rather than a row of tappable dots. A ten-dot row puts every
 * target under ~34px on a phone, below the 44px minimum, and a stepper makes reaching 8
 * cost eight taps. One tile is one tap to any value, with no arithmetic and no drag.
 *
 * The last tile spans the full width when the count is even, so 0..10 (eleven values)
 * closes cleanly instead of leaving a hole in the grid.
 *
 * Scrolls rather than shrinks, at every rep count. `flex-1` means the grid takes the space
 * its parent gives it and scrolls the rest -- shrinking the tiles to fit would quietly
 * reintroduce the touch-target problem this layout exists to solve, and growing to fit the
 * content is what let an 11-tile grid crush the question above it off the screen.
 */
export default function CountGrid({ reps, value, onSelect, disabled = false }: Props) {
  const values = Array.from({ length: reps + 1 }, (_, i) => i);
  const hasOrphan = values.length % 2 === 1;
  const paired = hasOrphan ? values.slice(0, -1) : values;
  const orphan = hasOrphan ? values[values.length - 1] : null;

  const rows: number[][] = [];
  for (let i = 0; i < paired.length; i += 2) rows.push(paired.slice(i, i + 2));

  return (
    <ScrollView
      className="w-full flex-1"
      contentContainerClassName="gap-2.5 pb-1"
      showsVerticalScrollIndicator={false}>
      {rows.map((row) => (
        <View key={row[0]} className="flex-row gap-2.5">
          {row.map((n) => (
            <Tile
              key={n}
              n={n}
              selected={value === n}
              disabled={disabled}
              onPress={() => onSelect(n)}
            />
          ))}
        </View>
      ))}

      {orphan !== null && (
        <Tile
          n={orphan}
          selected={value === orphan}
          disabled={disabled}
          onPress={() => onSelect(orphan)}
        />
      )}
    </ScrollView>
  );
}

function Tile({
  n,
  selected,
  disabled,
  onPress,
}: {
  n: number;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  // Unselected tiles take a hairline border, not the brand gold. With every tile
  // outlined in gold the selected one stops reading as selected at a glance.
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={`${n}`}
      disabled={disabled}
      onPress={onPress}
      className={`h-14 flex-1 items-center justify-center rounded-2xl border ${
        selected ? 'border-gold bg-gold' : 'border-white/10 bg-ink-raised active:bg-white/10'
      } ${disabled ? 'opacity-40' : ''}`}>
      <Text className={`font-display-bold text-2xl ${selected ? 'text-ink' : 'text-sand'}`}>
        {n}
      </Text>
    </Pressable>
  );
}
