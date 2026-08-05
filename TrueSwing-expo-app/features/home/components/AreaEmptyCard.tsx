import React from 'react';
import { View, Text, Pressable } from 'react-native';

import type { TaxonomyTerm } from 'features/library/services/taxonomyService';

type Props = {
  area: TaxonomyTerm | null;
  onBrowse: () => void;
};

/**
 * An area the golfer has nothing open in, and no diagnosed issues waiting.
 *
 *   Nothing on the go here.
 *   Splash outs, lies, distance control.
 *   Find bunker work
 *
 * Four of five areas will look like this for most golfers most of the time, which
 * is exactly why it is a real state and not a shrug. DESIGN.md: "Empty states are
 * screens, not a <Text>: they name the thing, say one honest sentence about why,
 * and give one way out." The way out is the library, scoped to this area.
 *
 * The blurb comes from taxonomy_areas, so it is admin-editable copy rather than a
 * string invented here — and it is optional, so this renders without it.
 */
export default function AreaEmptyCard({ area, onBrowse }: Props) {
  const label = area?.golfer_label ?? 'this area';

  return (
    <View>
      <Text className="font-display text-[19px] leading-[24px] text-sand">
        Nothing on the go here.
      </Text>

      {area?.blurb ? (
        <Text className="mt-2 text-[13px] leading-[19px] text-sand-dim">{area.blurb}</Text>
      ) : null}

      <Pressable
        onPress={onBrowse}
        accessibilityRole="button"
        accessibilityLabel={`Find ${label.toLowerCase()} work in the library`}
        className="mt-5 self-start border-b border-sand/[.35] pb-1"
        style={{ minHeight: 24 }}>
        <Text className="font-sans-semibold text-[13px] text-sand">
          {`Find ${label.toLowerCase()} work`}
        </Text>
      </Pressable>
    </View>
  );
}
