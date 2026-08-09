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
 * An area with nothing started in it.
 *
 *              Choose a focus to
 *              start practising.
 *
 *                    (+)              44px, gold stroke
 *              Find bunker work
 *
 * ONE JOB, AND THE SCREEN IS CLEARED FOR IT. When there are no suggestions either,
 * `HomeScreen` hides the streak and the archive too, so this is the only thing
 * below the area tabs. That is the point: a golfer who has nothing going in an area
 * should see one instruction and one control, not an invitation surrounded by
 * things that do not matter yet.
 *
 * CENTRED, WHICH THE REST OF THE APP IS NOT. Everything else on home is left
 * aligned against a common margin. A single-purpose state is the one place where
 * centring earns its keep — there is no column of siblings for it to break rank
 * with, and the composition reads as deliberate rather than as a left-aligned
 * screen that ran out of content. It does NOT generalise; centring the normal home
 * screen would be AI-slop pattern #4.
 *
 * `compact` turns the centring off. When diagnosed issues are waiting, they render
 * directly beneath this block (they ARE the focuses the headline names), and a
 * headline cannot be vertically centred above a list.
 *
 * THE BLURB IS GONE. `area.blurb` used to sit under the headline as a one-line
 * description of the area. It was the third thing to read on a screen whose whole
 * job is to get one tap, and the golfer already chose this area deliberately, so it
 * told them what they just told us. NOTE: home is no longer a consumer of
 * `taxonomy_areas.blurb`.
 *
 * THE `+` IS GOLD WHERE THE HERO'S IS CREAM. Not drift — DESIGN.md: "gold is for
 * content, not chrome." The hero corner is chrome. This is the content action, and
 * it is the only one on the screen, so it takes the accent.
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
