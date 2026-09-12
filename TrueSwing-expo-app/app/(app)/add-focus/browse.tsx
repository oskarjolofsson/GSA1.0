import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import LibraryScreen from 'features/library/LibraryScreen';
import { exitToHome } from 'features/shared/utils/exitToHome';

/**
 * A route, not drawer content — see `add-focus/upload.tsx` for why.
 *
 * `?area=` is optional and set only by home's empty-area action, which has
 * already named the part of the game. Without it the library opens on its
 * landing grid as before.
 *
 * Unlike upload.tsx and coach.tsx (both AI-analysis entry points, still hard
 * gated), this route has no entry-time premium check: browsing the library and
 * adding your first focus are always free. The real gate is server-side, at
 * actual focus creation (`require_focus_capacity`, 402 on a 2nd+ focus while
 * unsubscribed) -- LibraryScreen's existing 402 handling surfaces that.
 */
export default function Browse() {
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
