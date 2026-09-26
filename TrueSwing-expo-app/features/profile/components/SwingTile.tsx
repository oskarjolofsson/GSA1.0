import { Image, Pressable, View } from 'react-native';
import { Film } from 'lucide-react-native';

import type { Analysis } from 'features/analysis/types';
import colors from 'lib/colors';

export const TILE_ASPECT = 3 / 4;

type Props = {
  analysis: Analysis;
  width: number;
  onPress: () => void;
};

export default function SwingTile({ analysis, width, onPress }: Props) {
  const date = analysis.created_at
    ? new Date(analysis.created_at).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="imagebutton"
      // The tile is a picture with no text, so the date is the only thing that tells a
      // screen reader one swing from the next.
      accessibilityLabel={date ? `Swing from ${date}` : 'Swing'}
      style={{ width, height: width / TILE_ASPECT }}
      className="overflow-hidden rounded-xl border border-[rgba(232,220,196,0.13)] bg-ink-raised active:opacity-70">
      {analysis.thumbnail_url ? (
        <Image
          source={{ uri: analysis.thumbnail_url }}
          className="h-full w-full"
          resizeMode="cover"
        />
      ) : (
        // A swing whose thumbnail never generated is still a real swing and still opens.
        <View className="h-full w-full items-center justify-center">
          <Film size={22} color={colors['sand-dim']} strokeWidth={1.5} />
        </View>
      )}
    </Pressable>
  );
}
