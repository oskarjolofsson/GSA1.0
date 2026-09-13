import React from 'react';
import { View, Text, Pressable } from 'react-native';

import type { Issue } from 'features/issues/types';

type Props = {
  issues: Issue[];
  startingId: string | null;
  onStart: (issue: Issue) => void;
  /** Opens the issue sheet: what the jargon means, swing history, remove. */
  onOpenInfo: (issueId: string | null) => void;
};

const SAND_DIM = '#8A8676';

/**
 * Issues in this area that have been diagnosed but not started.
 *
 * Home is otherwise driven entirely by GET /programs/, which returns open programs only, so
 * without this list an AI analysis could diagnose three faults and none would appear on home.
 *
 * The only section on home carrying a label: a bare list of issue names does not say what it
 * is, where "12 day streak" does. Renders nothing at all when empty.
 */
export default function StartableList({ issues, startingId, onStart, onOpenInfo }: Props) {
  if (issues.length === 0) return null;

  return (
    <View>
      <Text className="font-sans-semibold text-[11px] uppercase tracking-[2.5px] text-sand-dim">
        AI swing analysis results
      </Text>

      <View className="mt-1.5">
        {issues.map((issue, index) => {
          const busy = startingId === issue.id;
          return (
            <View
              key={issue.id}
              className={`min-h-[52px] flex-row items-center justify-between py-4 ${
                index === 0 ? '' : 'border-t border-white/[.07]'
              }`}>
              <Pressable
                onPress={() => onStart(issue)}
                disabled={busy}
                accessibilityRole="button"
                accessibilityState={{ disabled: busy }}
                accessibilityLabel={`Start ${issue.title}`}
                className="mr-3 min-h-[44px] flex-1 flex-row items-center justify-between">
                <Text
                  className="mr-4 flex-1 text-[13.5px] leading-[19px] text-sand"
                  numberOfLines={1}>
                  {issue.title}
                </Text>
                <Text className="font-sans-semibold text-[13px] text-sand-dim">
                  {busy ? 'Starting…' : 'Start'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => onOpenInfo(issue.id ?? null)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`About ${issue.title}`}
                className="h-[26px] w-[26px] items-center justify-center rounded-full border border-sand/30 active:opacity-60">
                <Text className="font-display text-[12px] leading-none" style={{ color: SAND_DIM }}>
                  i
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
