import type { ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';

/** The eyebrow, copied from DESIGN.md rather than re-approximated. A fifth
 *  variant at a different size or tracking is how a system stops being one. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <Text className="text-[11px] font-semibold uppercase tracking-[2.5px] text-sand-dim">
      {children}
    </Text>
  );
}

/** A section separated by air and a hairline, not by a card. */
export function Section({
  eyebrow,
  first = false,
  children,
}: {
  eyebrow: string;
  first?: boolean;
  children: ReactNode;
}) {
  return (
    <View className={first ? 'pt-2' : 'mt-10 border-t border-sand/[.13] pt-8'}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <View className="mt-5">{children}</View>
    </View>
  );
}

export function FieldGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="mt-6 first:mt-0">
      <Text className="text-[13px] text-sand-dim">{label}</Text>
      <View className="mt-3 flex-row flex-wrap">{children}</View>
    </View>
  );
}

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
};

/** Outline pill. Gold is a stroke here, never a fill — a gold-filled chip row
 *  reads as someone else's product. min-h-[44px] is the accessibility floor. */
export function Chip({ label, selected, onPress, disabled = false }: ChipProps) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      className={`mb-2 mr-2 min-h-[44px] justify-center rounded-full border px-5 ${
        disabled
          ? 'border-sand/[.07] opacity-40'
          : selected
            ? 'border-gold'
            : 'border-sand/[.13] active:opacity-70'
      }`}>
      <Text
        className={`text-[15px] ${
          disabled ? 'text-sand-dim' : selected ? 'font-sans-medium text-gold' : 'text-sand'
        }`}>
        {label}
      </Text>
    </Pressable>
  );
}

type MissRowProps = {
  title: string;
  blurb?: string | null;
  selected: boolean;
  last: boolean;
  onPress: () => void;
};

/** A miss, as a row rather than a chip: these carry a golfer-facing title and a
 *  blurb ("I catch it thin" / "Struck low on the face..."), and a blurb does not
 *  fit in a pill. Same row shape the library fork uses, so the two screens that
 *  ask about misses ask in the same voice. */
export function MissRow({ title, blurb, selected, last, onPress }: MissRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={`min-h-[52px] flex-row items-center py-3.5 active:opacity-70 ${
        last ? '' : 'border-b border-sand/[.07]'
      }`}>
      <View className="flex-1 pr-4">
        <Text
          className={`text-[15px] ${selected ? 'font-sans-medium text-gold' : 'font-sans-medium text-sand'}`}>
          {title}
        </Text>
        {blurb ? (
          <Text className="mt-1 text-[13px] leading-[18px] text-sand-dim">{blurb}</Text>
        ) : null}
      </View>

      {/* A ring that fills when chosen. Selection is not signalled by colour
          alone — the checkbox shape carries it too. */}
      <View
        className={`h-[18px] w-[18px] items-center justify-center rounded-full border ${
          selected ? 'border-gold' : 'border-sand/25'
        }`}>
        {selected ? <View className="h-2 w-2 rounded-full bg-gold" /> : null}
      </View>
    </Pressable>
  );
}
