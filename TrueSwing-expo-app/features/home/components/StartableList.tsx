import React from 'react';
import { View, Text, Pressable } from 'react-native';

import type { Issue } from 'features/issues/types';

type Props = {
  issues: Issue[];
  startingId: string | null;
  onStart: (issue: Issue) => void;
};

/**
 * Issues in this area that have been diagnosed but not started.
 *
 *   COULD ALSO WORK ON
 *   Early extension                   Start
 *   ──────────────────────────────────────
 *   Casting the club                  Start
 *
 * WHY THIS EXISTS: the home screen is otherwise driven entirely by GET /programs/,
 * which returns open programs only. Without this list an AI analysis could
 * diagnose three faults and none of them would appear anywhere on home, so the
 * loop "film a swing → get faults → start working one" would dead-end at the
 * second step.
 *
 * THE ONLY SECTION WITH A LABEL. "Played a round?" and "12 day streak" say what
 * they are; a bare list of issue names does not. Deliberately inconsistent with
 * the other sections — clarity beats consistency where they conflict.
 *
 * Renders nothing at all when empty rather than an empty heading.
 */
export default function StartableList({ issues, startingId, onStart }: Props) {
  if (issues.length === 0) return null;

  return (
    <View>
      <Text className="font-sans-semibold text-[11px] uppercase tracking-[2.5px] text-sand-dim">
        Could also work on
      </Text>

      <View className="mt-1.5">
        {issues.map((issue, index) => {
          const busy = startingId === issue.id;
          return (
            <Pressable
              key={issue.id}
              onPress={() => onStart(issue)}
              disabled={busy}
              accessibilityRole="button"
              accessibilityState={{ disabled: busy }}
              accessibilityLabel={`Start ${issue.title}`}
              className={`min-h-[52px] flex-row items-center justify-between py-4 ${
                index === 0 ? '' : 'border-t border-white/[.07]'
              }`}>
              <Text
                className="mr-4 flex-1 text-[13.5px] leading-[19px] text-sand"
                numberOfLines={1}>
                {issue.title}
              </Text>
              <Text className="font-sans-semibold text-[13px] text-sand-dim">
                {busy ? 'Starting…' : 'Start'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
