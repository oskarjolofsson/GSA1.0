import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import LibraryScreen from 'features/library/LibraryScreen';
import { exitToHome } from 'features/shared/utils/exitToHome';
import { useRequirePremiumEntry } from 'features/billing/hooks/useRequirePremiumEntry';

/**
 * A route, not drawer content — see `add-focus/upload.tsx` for why.
 *
 * `?area=` is optional and set only by home's empty-area action, which has
 * already named the part of the game. Without it the library opens on its
 * landing grid as before.
 */
export default function Browse() {
  useRequirePremiumEntry();
  const router = useRouter();
  const { area } = useLocalSearchParams<{ area?: string }>();

  return (
    <View style={{ flex: 1 }}>
      <LibraryScreen
        initialAreaKey={area}
        onCancel={() => exitToHome(router)}
        onDone={(areaKey) => exitToHome(router, areaKey)}
        onFilmSwing={() => router.replace('/add-focus/upload')}
      />
    </View>
  );
}
