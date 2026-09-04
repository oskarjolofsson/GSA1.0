import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Plus } from 'lucide-react-native';

import type { TaxonomyTerm } from 'features/library/services/taxonomyService';

const GOLD = '#E4C892';

type Props = {
  area: TaxonomyTerm | null;
  onBrowse: () => void;
  /** True when suggestions render below this block, which stops it centring. */
  compact?: boolean;
};

/**
 * An area with nothing started in it: one instruction, one control. When no suggestions
 * follow either, `HomeScreen` hides the streak and archive so this is all there is.
 *
 * Centred, which nothing else on home is -- a single-purpose state has no column of siblings
 * to break rank with. It does NOT generalise. `compact` turns the centring off, for when
 * diagnosed issues render directly beneath.
 *
 * Its `+` is gold where the hero's is cream. See ADR-0025.
 */
export default function AreaEmptyCard({ area, onBrowse, compact = false }: Props) {
  const label = area?.golfer_label ?? 'this area';

  return (
    <View
      className={compact ? 'items-center' : 'flex-1 items-center justify-center'}
      style={compact ? undefined : { minHeight: 280 }}>
      <Text className="max-w-[220px] text-center font-display text-[19px] leading-[25px] text-sand">
        Choose a focus to start practising.
      </Text>

      <Pressable
        onPress={onBrowse}
        accessibilityRole="button"
        accessibilityLabel={`Find ${label.toLowerCase()} work in the library`}
        className="mt-5 items-center active:opacity-70">
        <View className="h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-gold">
          <Plus size={22} color={GOLD} strokeWidth={2} />
        </View>
        <Text className="mt-2.5 font-sans-semibold text-[13px] text-gold">
          {`Find ${label.toLowerCase()} work`}
        </Text>
      </Pressable>
    </View>
  );
}
