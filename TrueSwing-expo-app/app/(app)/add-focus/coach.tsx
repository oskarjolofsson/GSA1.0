import { View } from 'react-native';
import { useRouter } from 'expo-router';

import CoachFeedbackFlow from 'features/coachFeedback/CoachFeedbackFlow';
import { exitToHome } from 'features/shared/utils/exitToHome';
import { useRequirePremiumEntry } from 'features/billing/hooks/useRequirePremiumEntry';

/** A route, not drawer content — see `add-focus/upload.tsx` for why. */
export default function Coach() {
  useRequirePremiumEntry();
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
      <CoachFeedbackFlow
        onCancel={() => exitToHome(router)}
        onDone={(areaKey) => exitToHome(router, areaKey)}
      />
    </View>
  );
}
