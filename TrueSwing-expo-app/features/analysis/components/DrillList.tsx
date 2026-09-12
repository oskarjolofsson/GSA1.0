import { Text, View } from 'react-native';

import type { Drill } from 'features/drill/types';

type DrillListProps = {
  drills: Drill[];
};

/** Just the drill titles under a focus point's description — no action here. */
export default function DrillList({ drills }: DrillListProps) {
  if (drills.length === 0) return null;

  return (
    <View className="mt-3">
      {drills.map((drill) => (
        <Text key={drill.id} className="mt-1 text-[13px] leading-[19px] text-sand-dim">
          {'•'} {drill.title}
        </Text>
      ))}
    </View>
  );
}
