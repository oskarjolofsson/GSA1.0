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
 * Home is otherwise driven entirely by GET /programs/, which returns open programs only, so
 * without this list an AI analysis could diagnose three faults and none would appear on home.
 *
 * The only section on home carrying a label: a bare list of issue names does not say what it
 * is, where "12 day streak" does. Renders nothing at all when empty.
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
