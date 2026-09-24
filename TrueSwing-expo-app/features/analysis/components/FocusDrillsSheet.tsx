import { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, ChevronDown, ChevronRight } from 'lucide-react-native';

import { parseInstructionSteps } from 'features/shared/utils/parseInstructionSteps';
import type { Drill } from 'features/drill/types';
import colors from 'lib/colors';

type Props = {
  title: string | null;
  drills: Drill[];
  visible: boolean;
  onClose: () => void;
};

/**
 * DEMO: drill rail for a diagnosed focus, structured identically to the
 * library's IssueSheet.tsx drill rail (same spine, numbered steps via
 * parseInstructionSteps, one drill open at a time). No pinned action here --
 * unlike browse there's nothing to start, just close.
 */
export default function FocusDrillsSheet({ title, drills, visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [openDrillId, setOpenDrillId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) setOpenDrillId(null);
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable
          className="absolute inset-0 bg-black/60"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />

        <View
          accessibilityViewIsModal
          className="rounded-t-[26px] border border-white/10 border-b-0 bg-ink-raised"
          style={{ maxHeight: '80%', flexDirection: 'column' }}
        >
          <View className="items-center pt-3 pb-1">
            <View className="h-1 w-9 rounded-full bg-sand/20" />
          </View>

          <View className="flex-row items-start px-5 pt-3">
            <View className="flex-1 pr-3">
              <Text className="text-[10px] uppercase tracking-[2.6px] text-gold">
                What you&apos;ll practise
              </Text>
              <Text className="mt-2 font-display-bold text-[23px] leading-[28px] text-sand">
                {title}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Close"
              className="h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-ink active:opacity-70"
            >
              <X size={17} color={colors['sand-dim']} />
            </Pressable>
          </View>

          <ScrollView
            className="mt-4"
            style={{ flexShrink: 1 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {drills.map((drill, index) => (
              <DrillEntry
                key={drill.id}
                drill={drill}
                open={openDrillId === drill.id}
                isLast={index === drills.length - 1}
                onToggle={() => setOpenDrillId(openDrillId === drill.id ? null : drill.id)}
              />
            ))}

            {drills.length === 0 ? (
              <Text className="text-[13px] leading-[20px] text-sand-dim">
                No drills written for this focus yet.
              </Text>
            ) : null}
          </ScrollView>

          <View style={{ height: insets.bottom + 12 }} />
        </View>
      </View>
    </Modal>
  );
}

/** Copied from features/library/components/IssueSheet.tsx -- same spine, same
 *  numbered-step format, so a drill reads identically in both places. */
function DrillEntry({
  drill,
  open,
  isLast,
  onToggle,
}: {
  drill: Drill;
  open: boolean;
  isLast: boolean;
  onToggle: () => void;
}) {
  const steps = parseInstructionSteps(drill.task);

  return (
    <View className="flex-row">
      <View className="w-[9px] items-center">
        <View
          className="absolute top-0 w-px bg-sand/10"
          style={isLast ? { height: 23 } : { bottom: 0 }}
        />
        <View
          className={`z-10 mt-[19px] h-[7px] w-[7px] rounded-full border border-gold ${
            open ? 'bg-gold' : 'bg-ink-raised'
          }`}
        />
      </View>

      <View className="flex-1 pb-1 pl-3.5 pt-3.5">
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityHint={open ? 'Hides the steps' : 'Shows the steps'}
          className="min-h-[30px] flex-row items-center active:opacity-70"
        >
          <Text className="flex-1 pr-2 font-sans-medium text-[15px] leading-[20px] text-sand">
            {drill.title}
          </Text>
          {open ? (
            <ChevronDown size={15} color="#C5A059" />
          ) : (
            <ChevronRight size={15} color={colors['sand-dim']} />
          )}
        </Pressable>

        {open
          ? steps.map((step, index) => (
              <View key={`${drill.id}-${index}`} className="mt-3 flex-row">
                <Text className="w-[15px] font-display text-[12px] leading-[20px] text-gold">
                  {index + 1}
                </Text>
                <Text className="flex-1 text-[13px] leading-[20px] text-sand-dim">{step}</Text>
              </View>
            ))
          : null}

        {open && steps.length === 0 ? (
          <Text className="mt-3 text-[13px] leading-[20px] text-sand-dim">
            No instructions written for this drill yet.
          </Text>
        ) : null}
      </View>
    </View>
  );
}
