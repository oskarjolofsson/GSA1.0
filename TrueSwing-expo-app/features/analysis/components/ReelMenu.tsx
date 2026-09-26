import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pencil, Trash2 } from 'lucide-react-native';

import GlassSurface from 'features/shared/components/GlassSurface';
import colors from 'lib/colors';

type Props = {
  visible: boolean;
  onClose: () => void;
  onDraw: () => void;
  onDelete: () => void;
};

/**
 * The reel's overflow menu: the two things you can do to a swing that are not watching it.
 *
 * Delete lives in here rather than in the header because a reel is a surface you scroll
 * fast, and a delete button sitting under your thumb the whole time is one mistap from
 * losing a swing. The confirm dialog behind it is the second gate, not the first.
 *
 * Each row closes the menu BEFORE acting. Both actions put something else full-screen --
 * the drawing overlay, the confirm dialog -- and a modal still dismissing underneath one
 * of those leaves the app briefly showing two layers competing for the same taps.
 */
export default function ReelMenu({ visible, onClose, onDraw, onDelete }: Props) {
  const insets = useSafeAreaInsets();

  const run = (action: () => void) => {
    onClose();
    action();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* The backdrop is the dismiss target, so it has to cover the screen and stay
          invisible -- a scrim would dim the swing the menu is about. */}
      <Pressable className="flex-1" onPress={onClose} accessibilityLabel="Close menu" />

      <View
        className="absolute right-4"
        // Below the 44px overflow button that opens it: top inset, the header's 8px
        // offset, the button, and 8px of air.
        style={{ top: insets.top + 8 + 44 + 8 }}
        pointerEvents="box-none">
        <GlassSurface radius={18} style={{ width: 210 }}>
          <MenuRow
            label="Draw on swing"
            icon={<Pencil size={17} color={colors.sand} strokeWidth={1.75} />}
            onPress={() => run(onDraw)}
          />
          <View className="h-px bg-[rgba(232,220,196,0.13)]" />
          <MenuRow
            label="Delete swing"
            tone="danger"
            icon={<Trash2 size={17} color={colors.danger} strokeWidth={1.75} />}
            onPress={() => run(onDelete)}
          />
        </GlassSurface>
      </View>
    </Modal>
  );
}

function MenuRow({
  label,
  icon,
  onPress,
  tone = 'default',
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  tone?: 'default' | 'danger';
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="min-h-[44px] flex-row items-center px-4 active:opacity-60">
      {icon}
      <Text className={`ml-3 text-[15px] ${tone === 'danger' ? 'text-danger' : 'text-sand'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
