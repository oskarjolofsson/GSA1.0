import React from 'react';
import { View, Text, Pressable } from 'react-native';

import type { TaxonomyTerm } from 'features/library/services/taxonomyService';

type Props = {
  areas: TaxonomyTerm[];
  selectedKey: string | null;
  /** How many open programs each area has, keyed by area key. */
  countByArea: Record<string, number>;
  onSelect: (areaKey: string) => void;
};

/**
 * The parts of the game, as underline tabs. Three states, each with two cues, because
 * DESIGN.md forbids colour-only signalling:
 *
 *   selected           bright label + numeral + 2px gold underline
 *   active, not sel.   bright label + numeral
 *   inactive           dim label, no numeral
 *
 * The numeral, rather than a dot, is what tells a golfer they are at the two-per-area cap
 * before they try a third and get a 409 back.
 *
 * Columns are equal-width, not natural: `golfer_label` is admin-editable, and a longer
 * rename must wrap rather than push an area off the row and out of reach. Inactive areas
 * stay tappable -- DESIGN.md C5, "no area is ever greyed out".
 */
export default function AreaTabs({ areas, selectedKey, countByArea, onSelect }: Props) {
  return (
    <View className="mt-6 flex-row border-b border-white/[.07]">
      {areas.map((area) => {
        const count = countByArea[area.key] ?? 0;
        const isActive = count > 0;
        const isSelected = area.key === selectedKey;

        return (
          <Pressable
            key={area.key}
            onPress={() => onSelect(area.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={
              isActive
                ? `${area.golfer_label}, ${count} open`
                : `${area.golfer_label}, nothing open`
            }
            // flex-1 + min-w-0 is what keeps five columns even.
            className="min-h-[44px] min-w-0 flex-1 flex-row items-start justify-center gap-x-1 px-0.5 pb-3">
            <Text
              className={
                isSelected
                  ? 'text-center font-sans-semibold text-[13px] leading-[17px] text-sand'
                  : isActive
                    ? 'text-center font-sans-medium text-[13px] leading-[17px] text-sand'
                    : 'text-center text-[13px] leading-[17px] text-sand-dim'
              }>
              {area.golfer_label}
            </Text>

            {isActive ? (
              <Text className="font-display text-[12px] leading-[17px] text-sand-dim">{count}</Text>
            ) : null}

            {isSelected ? <View className="absolute inset-x-0 -bottom-px h-0.5 bg-gold" /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
